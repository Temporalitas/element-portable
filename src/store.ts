/*
Copyright 2022-2025 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import ElectronStore from "electron-store";
import { app, type Session } from "electron";
import fs from 'node:fs';
import path from 'node:path';
import crypto from "node:crypto";

import { _t } from "./language-helper.js";
import { executablePath } from "./protocol.js";

/**
 * Service name for storing secrets.
 */
const SERVICE = "element.io";
/**
 * Legacy service name for reading secrets.
 */
const LEGACY_SERVICE = "riot.im";

interface StoreData {
    warnBeforeExit: boolean;
    minimizeToTray: boolean;
    spellCheckerEnabled: boolean;
    autoHideMenuBar: boolean;
    locale?: string | string[];
    disableHardwareAcceleration: boolean;
    enableContentProtection: boolean;
    /** whether to open the app at login minimised, only valid when app.openAtLogin is true */
    openAtLoginMinimised: boolean;
}

interface SecretsData {
    [key: string]: string;
}

function relaunchApp(): void {
    console.info("Relaunching app...");
    app.relaunch({execPath: executablePath});
    app.exit();
}

// Encrypting user secrets with a standard password: not very good protection, but will help against standard stealer programs and parsers
const password = "7e8b1R%70949";

function encrypt(text: string): string {
    const algorithm = 'aes-256-ctr';
    const key = Buffer.concat([Buffer.from(password), Buffer.alloc(32)], 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + encrypted.toString('hex');
}

function decrypt(text: string): string {
    const algorithm = 'aes-256-ctr';
    const key = Buffer.concat([Buffer.from(password), Buffer.alloc(32)], 32);
    const iv = Buffer.from(text.substring(0, 32), 'hex');
    const encryptedText = Buffer.from(text.substring(32), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

/**
 * Clear all data and relaunch the app.
 */
export async function clearDataAndRelaunch(electronSession: Session): Promise<void> {
    Store.instance?.clear();
    electronSession.flushStorageData();
    await electronSession.clearStorageData();
    relaunchApp();
}

function getSecretsFilePath(): string {
    return path.join(app.getPath('userData'), 'shjgvijf.raw');
}

function loadSecrets(): SecretsData {
    try {
        const data = fs.readFileSync(getSecretsFilePath(), 'utf8');
        return JSON.parse(decrypt(data)) || {};
    } catch (_) {
        return {};
    }
}

function saveSecrets(data: SecretsData): void {
    fs.writeFileSync(getSecretsFilePath(), encrypt(JSON.stringify(data)));
}

function toKey(service: string, account: string): string {
    return `keytar_pwd_&${service}&${account}`;
}

/**
 * JSON-backed store for settings which need to be accessible by the main process.
 * Secrets are stored in a plain JSON file in the user data directory.
 */
class Store extends ElectronStore<StoreData> {
    private static internalInstance?: Store;

    public static get instance(): Store | undefined {
        return Store.internalInstance;
    }

    /**
     * Prepare the store.
     * Must be executed in the first tick of the event loop so that it can call Electron APIs before ready state.
     */
    public static initialize(): Store {
        if (Store.internalInstance) {
            throw new Error("Store already initialized");
        }

        const store = new Store();
        Store.internalInstance = store;
        return store;
    }

    private constructor() {
        super({
            name: "electron-config",
            clearInvalidConfig: false,
            schema: {
                warnBeforeExit: {
                    type: "boolean",
                    default: true,
                },
                minimizeToTray: {
                    type: "boolean",
                    default: true,
                },
                spellCheckerEnabled: {
                    type: "boolean",
                    default: true,
                },
                autoHideMenuBar: {
                    type: "boolean",
                    default: true,
                },
                locale: {
                    anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
                },
                disableHardwareAcceleration: {
                    type: "boolean",
                    default: false,
                },
                enableContentProtection: {
                    type: "boolean",
                    default: false,
                },
                openAtLoginMinimised: {
                    type: "boolean",
                    default: true,
                },
            },
        });
    }

    /**
     * Get the stored secret for the key.
     *
     * @param key The string key name.
     *
     * @returns A promise for the secret string.
     */
    public async getSecret(key: string): Promise<string | undefined> {
        const secrets = loadSecrets();
        return secrets[toKey(SERVICE, key)] ?? secrets[toKey(LEGACY_SERVICE, key)];
    }

    /**
     * Add the secret for the key to storage.
     *
     * @param key The string key name.
     * @param secret The string password.
     *
     * @returns A promise for the set password completion.
     */
    public async setSecret(key: string, secret: string): Promise<void> {
        const secrets = loadSecrets();
        secrets[toKey(SERVICE, key)] = secret;
        saveSecrets(secrets);
    }

    /**
     * Delete the stored password for the key.
     *
     * @param key The string key name.
     */
    public async deleteSecret(key: string): Promise<void> {
        const secrets = loadSecrets();
        delete secrets[toKey(SERVICE, key)];
        delete secrets[toKey(LEGACY_SERVICE, key)];
        saveSecrets(secrets);
    }
}

export default Store;
