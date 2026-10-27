# SELECT-only bridge to the TALON DB. Run by a human in a terminal; password is typed by the human.
# Usage: db_bridge.ps1 -Dir <work dir> -Server "<host>,1433"   (database name: -Database, default TALON)
# Claude puts *.sql files in <Dir>\queue ; results appear in <Dir>\results. Create <Dir>\stop to exit.
param(
    [Parameter(Mandatory = $true)][string]$Dir,
    [Parameter(Mandatory = $true)][string]$Server,   # e.g. "<db-host>,1433"
    [string]$Database = "TALON",
    [int]$MaxRows = 200
)

$queue = Join-Path $Dir "queue"
$results = Join-Path $Dir "results"
$done = Join-Path $Dir "done"
foreach ($d in $queue, $results, $done) { New-Item -ItemType Directory -Force $d | Out-Null }
Remove-Item (Join-Path $Dir "stop") -ErrorAction SilentlyContinue

$cred = Get-Credential -Message "TALON DB $Server (SQL auth)"
$cs = "Server=$Server;Database=$Database;User ID=$($cred.UserName);Password=$($cred.GetNetworkCredential().Password);Encrypt=False;TrustServerCertificate=True;ApplicationIntent=ReadOnly"
$conn = New-Object System.Data.SqlClient.SqlConnection $cs
try { $conn.Open() } catch { Write-Host "CONNECT FAILED: $($_.Exception.Message)"; exit 1 }
if ($conn.State -ne 'Open') { Write-Host "CONNECT FAILED: state=$($conn.State)"; exit 1 }
Write-Host "Connected: $Server / $Database. Waiting for queries in $queue (Ctrl-C or 'stop' file to exit)"

$deny = '\b(insert|update|delete|merge|drop|alter|create|truncate|exec|execute|grant|revoke|into|backup|restore|shutdown|kill|openrowset|openquery|opendatasource|bulk|waitfor|dbcc|use)\b|\bxp_|\bsp_'

function Test-ReadOnlySql([string]$sql) {
    $s = $sql.Trim().TrimEnd(';').Trim()
    if ($s -match ';') { return "multiple statements are not allowed" }
    if ($s -match '--|/\*') { return "comments are not allowed" }
    if ($s -notmatch '^(select|with)\b') { return "only SELECT / WITH is allowed" }
    if ($s -match $deny) { return "forbidden keyword: $($Matches[0])" }
    return $null
}

while (-not (Test-Path (Join-Path $Dir "stop"))) {
    foreach ($f in Get-ChildItem $queue -Filter *.sql | Sort-Object Name) {
        $name = $f.BaseName
        $sql = Get-Content $f.FullName -Raw -Encoding UTF8
        $reason = Test-ReadOnlySql $sql
        if ($reason) {
            "REJECTED: $reason" | Out-File (Join-Path $results "$name.err.txt") -Encoding UTF8
            Write-Host "[$name] rejected: $reason"
        } else {
            try {
                $cmd = $conn.CreateCommand()
                $cmd.CommandText = $sql.Trim().TrimEnd(';')
                $cmd.CommandTimeout = 60
                $reader = $cmd.ExecuteReader()
                $table = New-Object System.Data.DataTable
                $table.Load($reader, [System.Data.LoadOption]::OverwriteChanges)
                $reader.Close()
                $rows = $table.Rows.Count
                $table | Select-Object -First $MaxRows | Select-Object * -ExcludeProperty RowError, RowState, Table, ItemArray, HasErrors |
                    Export-Csv (Join-Path $results "$name.csv") -NoTypeInformation -Encoding UTF8
                if ($rows -gt $MaxRows) { "TRUNCATED: $rows rows, first $MaxRows saved" | Out-File (Join-Path $results "$name.note.txt") -Encoding UTF8 }
                Write-Host "[$name] ok: $rows rows"
            } catch {
                $_.Exception.Message | Out-File (Join-Path $results "$name.err.txt") -Encoding UTF8
                Write-Host "[$name] error: $($_.Exception.Message)"
            }
        }
        Move-Item $f.FullName (Join-Path $done $f.Name) -Force
    }
    Start-Sleep -Milliseconds 700
}
$conn.Close()
Write-Host "Stopped."
