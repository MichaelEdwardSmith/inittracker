$path = 'C:\Users\mojpo\WebstormProjects\Initiative\src\routes\+page.svelte'
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

$startMarker = "`n`t`t<div class=`"w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 shadow-2xl`">"
$endMarker = "`n`t</div>`n{/if}`n`n<!-- DM Inbox modal -->"

$startIdx = $content.IndexOf($startMarker)
$endIdx = $content.IndexOf($endMarker)

if ($startIdx -lt 0) { Write-Host "START MARKER NOT FOUND"; exit 1 }
if ($endIdx -lt 0) { Write-Host "END MARKER NOT FOUND"; exit 1 }

Write-Host "Start at $startIdx, End at $endIdx"

$newContent = $content.Substring(0, $startIdx) + "`n{/if}`n`n<!-- DM Inbox modal -->" + $content.Substring($endIdx + $endMarker.Length)

$newBytes = [System.Text.Encoding]::UTF8.GetBytes($newContent)
[System.IO.File]::WriteAllBytes($path, $newBytes)
Write-Host "Done. File written."
