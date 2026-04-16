import subprocess
import sys
import os
import signal
import time

def run_command(command, cwd, name):
    """Starts a subprocess and returns the process object."""
    print(f"🚀 Starting {name}...")
    return subprocess.Popen(
        command,
        cwd=cwd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True
    )

def main():
    root_dir = os.getcwd()
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    # 1. Start Backend (FastAPI)
    # Using 'python main.py' assuming dependencies are installed in global or active env
    backend_proc = run_command("python main.py", backend_dir, "Backend (FastAPI)")

    # 2. Start Frontend (Next.js)
    frontend_proc = run_command("npm run dev", frontend_dir, "Frontend (Next.js)")

    def signal_handler(sig, frame):
        print("\n🛑 Stopping servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    print("\n✅ Both servers are starting!")
    print("📡 Backend: http://localhost:8000")
    print("🌐 Frontend: http://localhost:3000")
    print("💡 Press Ctrl+C to stop both servers.\n")

    # Monitor output
    try:
        while True:
            # Check if processes are still running
            if backend_proc.poll() is not None:
                print("❌ Backend stopped unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("❌ Frontend stopped unexpectedly.")
                break
            
            # Non-blocking check for output could be added here, 
            # but for simplicity we just keep the main thread alive.
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()
