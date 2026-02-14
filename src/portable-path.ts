import childProcess from "node:child_process";
import { dirname } from "node:path";
import process from "node:process";

interface PortableInfo {
    executablePath?: string;
    executableDir: string;
}

let cachedInfo: PortableInfo | undefined;

function tryExec(command: string): string | undefined {
    try {
        return childProcess.execSync(command, {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        }).trim();
    } catch {
        return undefined;
    }
}

function isWindowsExePath(value: string | undefined): value is string {
    if (!value) return false;
    // Accept only a single absolute .exe path line.
    return /^[a-zA-Z]:\\.+\.exe$/i.test(value) && !/[\r\n]/.test(value);
}

function resolveWindowsParentExecutablePath(): string {
    const psPath = tryExec(
        `powershell.exe -NoProfile -NonInteractive -Command "(Get-Process -Id ${process.ppid}).Path"`,
    );
    if (isWindowsExePath(psPath)) return psPath;

    const wmicOut = tryExec(
        `wmic process where "processid=${process.ppid}" get executablepath /value`,
    );
    const wmicPath = wmicOut
        ?.split(/\r?\n/)
        .find((line) => line.startsWith("ExecutablePath="))
        ?.slice("ExecutablePath=".length)
        .trim();

    if (isWindowsExePath(wmicPath)) return wmicPath;

    throw new Error("Failed to resolve parent executable path");
}

function resolvePortableInfo(): PortableInfo {
    const electronEnvPath = process.env.PORTABLE_EXECUTABLE_FILE;
    if (electronEnvPath) return { executablePath: electronEnvPath, executableDir: dirname(electronEnvPath) };

    if (process.platform === "win32") {
      const exe = resolveWindowsParentExecutablePath();
      return { executablePath: exe, executableDir: dirname(exe) };
    }

    if (process.platform === "linux") {
        const exe = childProcess.execSync(`readlink -f /proc/${process.ppid}/exe`).toString().trim();
        return { executablePath: exe, executableDir: dirname(exe) };
    }

    throw new Error("Failed to find parent electron process invoked by user");
}

function getPortableInfo(): PortableInfo {
    if (!cachedInfo) cachedInfo = resolvePortableInfo();
    return cachedInfo;
}

export function getPortableExecutableDir(): string {
    return getPortableInfo().executableDir;
}

export function getPortableExecutablePath(): string {
    const { executablePath } = getPortableInfo();
    if (!executablePath) throw new Error("Portable executable path is unavailable in this launch mode");
    return executablePath;
}