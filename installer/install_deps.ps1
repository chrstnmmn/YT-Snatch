# installer/install_deps.ps1
Write-Host "Installing dependencies..."

# Install Python (silent, adds to PATH)
Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.11.4/python-3.11.4-amd64.exe" -OutFile "$env:TEMP\python-installer.exe"
Start-Process -Wait -FilePath "$env:TEMP\python-installer.exe" -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1"

# Install FFmpeg (extracts to Program Files)
Invoke-WebRequest -Uri "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" -OutFile "$env:TEMP\ffmpeg.zip"
Expand-Archive -Path "$env:TEMP\ffmpeg.zip" -DestinationPath "$env:ProgramFiles\ffmpeg" -Force
[Environment]::SetEnvironmentVariable("PATH", "$env:ProgramFiles\ffmpeg\bin;" + [Environment]::GetEnvironmentVariable("PATH", "Machine"), "Machine")

# Install yt-dlp (user-level, adds to PATH)
New-Item -ItemType Directory -Force -Path "$env:APPDATA\yt-dlp"
Invoke-WebRequest -Uri "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -OutFile "$env:APPDATA\yt-dlp\yt-dlp.exe"
[Environment]::SetEnvironmentVariable("PATH", "$env:APPDATA\yt-dlp;" + [Environment]::GetEnvironmentVariable("PATH", "User"), "User")

Write-Host "Dependencies installed successfully."