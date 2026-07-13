[CmdletBinding()]
param(
    [switch]$SkipInstall
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$previousMode = $env:SUPRO_DATA_MODE

function Resolve-PnpmRunner {
    $corepack = Get-Command corepack.cmd -ErrorAction SilentlyContinue
    if ($null -ne $corepack) {
        return [PSCustomObject]@{
            Command = $corepack.Source
            Prefix = @("pnpm")
        }
    }

    $pnpm = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
    if ($null -ne $pnpm) {
        return [PSCustomObject]@{
            Command = $pnpm.Source
            Prefix = @()
        }
    }

    throw "Node.js 22.19.0 이상과 함께 제공되는 Corepack 또는 pnpm 11.1.2가 필요합니다."
}

function Invoke-Pnpm {
    param([string[]]$Arguments)

    $command = $script:PnpmRunner.Command
    $commandArguments = @($script:PnpmRunner.Prefix) + $Arguments
    & $command @commandArguments
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm 명령이 실패했습니다: $($Arguments -join ' ')"
    }
}

Push-Location $repoRoot
try {
    $node = Get-Command node.exe -ErrorAction Stop
    $nodeVersionText = (& $node.Source -p "process.versions.node").Trim()
    if ([Version]$nodeVersionText -lt [Version]"22.19.0") {
        throw "Node.js 22.19.0 이상이 필요합니다. 현재 버전: $nodeVersionText"
    }

    $script:PnpmRunner = Resolve-PnpmRunner
    $pnpmCommand = $script:PnpmRunner.Command
    $pnpmArguments = @($script:PnpmRunner.Prefix)
    $pnpmVersionArguments = @($pnpmArguments) + @("--version")
    $pnpmVersion = (& $pnpmCommand @pnpmVersionArguments | Select-Object -Last 1).Trim()
    if ($pnpmVersion -ne "11.1.2") {
        throw "pnpm 11.1.2가 필요합니다. 현재 버전: $pnpmVersion"
    }

    if (-not (Test-Path ".env.local")) {
        Copy-Item ".env.example" ".env.local"
        Write-Host "fixture 전용 .env.local을 생성했습니다."
    }

    $env:SUPRO_DATA_MODE = "fixture"
    if (-not $SkipInstall) {
        Invoke-Pnpm -Arguments @("install", "--frozen-lockfile")
    }
    Invoke-Pnpm -Arguments @("check")

    Write-Host "SUPRO_WINDOWS_READY node=$nodeVersionText pnpm=$pnpmVersion fixture=true"
    Write-Host "실행: corepack pnpm dev"
    Write-Host "브라우저: http://localhost:3000"
}
finally {
    if ($null -eq $previousMode) {
        Remove-Item Env:SUPRO_DATA_MODE -ErrorAction SilentlyContinue
    }
    else {
        $env:SUPRO_DATA_MODE = $previousMode
    }
    Pop-Location
}
