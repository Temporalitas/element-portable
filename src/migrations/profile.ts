  import fs from "node:fs";
  import path from "node:path";
  
function moveDirIfNeeded(from: string, to: string): void {
    if (!fs.existsSync(from) || fs.existsSync(to)) return;
    fs.mkdirSync(path.dirname(to), { recursive: true });

    try {
        fs.renameSync(from, to);
    } catch (e) {
        const err = e as NodeJS.ErrnoException;
        if (err.code !== "EXDEV") return console.error("Profile migration failed");
        fs.cpSync(from, to, { recursive: true, errorOnExist: true });
        fs.rmSync(from, { recursive: true, force: true });
    }
}

export function migrateLegacyProfileLayout(executableDir: string, profile: string, userDataPath: string, sessionDataPath: string): void {
    if (!profile) return; // default profile path is already the same
    const oldUserDataPath = path.join(executableDir, "userData", profile);
    const oldSessionDataPath = path.join(executableDir, "sessionData", profile);

    moveDirIfNeeded(oldUserDataPath, userDataPath);
    moveDirIfNeeded(oldSessionDataPath, sessionDataPath);
}
