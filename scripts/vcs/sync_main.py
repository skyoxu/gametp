import os
import sys
import subprocess
from datetime import datetime


def run_cmd(cmd, cwd=None):
    """Run a command and return (code, stdout+stderr)."""
    proc = subprocess.Popen(
        cmd,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=False,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    output_lines = []
    while True:
        line = proc.stdout.readline()
        if not line and proc.poll() is not None:
            break
        if line:
            output_lines.append(line)
            print(line, end="")
    code = proc.wait()
    return code, "".join(output_lines)


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def main() -> int:
    # Prepare logs folder: logs/YYYY-MM-DD/vcs
    day = datetime.now().strftime("%Y-%m-%d")
    log_dir = os.path.join("logs", day, "vcs")
    ensure_dir(log_dir)
    log_file = os.path.join(log_dir, "sync_main.log")

    # Tee stdout/stderr to file
    # We keep console prints in English per repo rules.
    fh = open(log_file, "a", encoding="utf-8", errors="replace")
    fh.write("==== sync_main start ====" + os.linesep)
    fh.write(f"time: {datetime.now().isoformat()}" + os.linesep)
    fh.flush()

    def log(msg: str):
        print(msg)
        fh.write(msg + os.linesep)
        fh.flush()

    def run_and_log(cmd):
        log(f"$ {' '.join(cmd)}")
        code, out = run_cmd(cmd)
        fh.write(out)
        fh.flush()
        return code, out

    # 1) Basic repo sanity
    code, _ = run_and_log(["git", "rev-parse", "--is-inside-work-tree"])
    if code != 0:
        log("ERROR: Not inside a Git repository.")
        fh.close()
        return 2

    # Record current branch and HEAD
    _, current_branch = run_and_log(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    current_branch = current_branch.strip()
    _, prev_head = run_and_log(["git", "rev-parse", "HEAD"])
    prev_head = prev_head.strip()

    log(f"Current branch: {current_branch}")
    log(f"Previous HEAD: {prev_head}")

    # 2) Fetch from origin
    code, _ = run_and_log(["git", "remote", "-v"])
    code, _ = run_and_log(["git", "fetch", "--all", "--prune", "--tags"])
    if code != 0:
        log("ERROR: Fetch failed.")
        fh.close()
        return 3

    # 3) Ensure local main exists or track origin/main
    code, _ = run_and_log(["git", "show-ref", "--verify", "--quiet", "refs/heads/main"])
    if code != 0:
        # Create local main tracking origin/main if remote exists
        code, _ = run_and_log(["git", "show-ref", "--verify", "--quiet", "refs/remotes/origin/main"])
        if code == 0:
            code, _ = run_and_log(["git", "checkout", "-b", "main", "--track", "origin/main"])
            if code != 0:
                log("ERROR: Failed to create local main tracking origin/main.")
                fh.close()
                return 4
        else:
            log("ERROR: origin/main not found. Ensure remote has a main branch.")
            fh.close()
            return 5

    # Switch to main if needed
    code, _ = run_and_log(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    active = _.strip()
    if active != "main":
        code, _ = run_and_log(["git", "checkout", "main"])
        if code != 0:
            log("ERROR: Failed to checkout main.")
            fh.close()
            return 6

    # 4) Fast-forward main to origin/main (non-destructive)
    code, _ = run_and_log(["git", "merge", "--ff-only", "origin/main"])
    if code != 0:
        log(
            "WARNING: Fast-forward failed. You may have local commits on main.\n"
            "You can resolve manually (rebase onto origin/main) or run a hard reset if appropriate."
        )
        fh.close()
        return 7

    # 5) Verify new HEAD and show last commit
    _, new_head = run_and_log(["git", "rev-parse", "HEAD"])
    new_head = new_head.strip()
    _, _ = run_and_log(["git", "log", "-1", "--oneline", "--decorate"])

    log(f"Sync completed. HEAD: {prev_head} -> {new_head}")
    fh.write("==== sync_main end ====" + os.linesep)
    fh.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

