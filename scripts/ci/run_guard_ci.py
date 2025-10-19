import os
import sys
import subprocess
from datetime import datetime


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def run_and_tee(cmd: list[str] | str, logfile: str, cwd: str | None = None) -> int:
    with open(logfile, "a", encoding="utf-8", errors="replace") as lf:
        lf.write(f"==== guard:ci start {datetime.now().isoformat()} ====" + os.linesep)
        lf.write("$ " + " ".join(cmd) + os.linesep)
        lf.flush()

        # On Windows, allow shell to resolve npm.cmd
        proc = subprocess.Popen(
            cmd if isinstance(cmd, list) else cmd,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            shell=True,
        )
        assert proc.stdout is not None
        for line in proc.stdout:
            # Always write to log file
            lf.write(line)
            # Best-effort console echo; replace unencodable chars
            try:
                sys.stdout.write(line)
            except Exception:
                try:
                    sys.stdout.write(line.encode('utf-8', 'replace').decode('utf-8', 'replace'))
                except Exception:
                    # Give up on console echo for this line
                    pass
        code = proc.wait()
        lf.write(f"==== guard:ci end code={code} {datetime.now().isoformat()} ====" + os.linesep)
        return code


def main() -> int:
    day = datetime.now().strftime("%Y-%m-%d")
    log_dir = os.path.join("logs", day, "ci")
    ensure_dir(log_dir)
    stamp = datetime.now().strftime("%H%M%S")
    log_path = os.path.join(log_dir, f"guard_ci_{stamp}.log")

    # Run guard:ci
    code = run_and_tee("npm run guard:ci", log_path, cwd=None)
    # Also write a short summary file
    with open(os.path.join(log_dir, f"guard_ci_{stamp}.summary.txt"), "w", encoding="utf-8") as sf:
        sf.write(f"timestamp={datetime.now().isoformat()}\nexit_code={code}\nlogfile={os.path.abspath(log_path)}\n")
    return code


if __name__ == "__main__":
    sys.exit(main())
