$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
$files = "index.html", "project1.html", "project2.html", "board.html", "contact.html"
foreach ($f in $files) {
    if (Test-Path $f) {
        $content = [System.IO.File]::ReadAllText((Convert-Path $f))
        [System.IO.File]::WriteAllText((Convert-Path $f), $content, $Utf8NoBomEncoding)
    }
}
