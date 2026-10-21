Add-Type -AssemblyName System.Drawing
$assetRoot = 'D:/Files/EDUCATION/NammaCrew/mobile/assets'
# A continuous Bezier silhouette, not five disconnected circles.
foreach ($count in @(4,5)) {
  $width = $count * 200
  $bitmap = New-Object System.Drawing.Bitmap $width,210
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.StartFigure()
  for ($i=0; $i -lt $count; $i++) {
    $x=$i*200
    if ($i -eq 0) { $p.AddBezier(8,105,8,22,80,-5,132,17) }
    else { $p.AddBezier($x-12,46,$x+40,-8,$x+90,-5,$x+132,17) }
    if ($i -lt $count-1) {$p.AddBezier($x+132,17,$x+177,35,$x+162,65,$x+188,46)}
    else {$p.AddBezier($x+132,17,$x+190,34,$x+194,67,$x+192,105)}
  }
  for ($i=$count-1; $i -ge 0; $i--) {
    $x=$i*200
    if ($i -eq $count-1) {$p.AddBezier($x+192,105,$x+194,180,$x+127,212,$x+68,190)}
    else {$p.AddBezier($x+212,163,$x+161,215,$x+110,210,$x+68,190)}
    if ($i -gt 0) {$p.AddBezier($x+68,190,$x+22,172,$x+38,142,$x+12,163)}
    else {$p.AddBezier(68,190,10,172,8,135,8,105)}
  }
  $p.CloseFigure()
  $rect = [System.Drawing.Rectangle]::new(0,0,$width,210)
  $fill = [System.Drawing.Drawing2D.LinearGradientBrush]::new($rect,[System.Drawing.Color]::FromArgb(130,255,255,255),[System.Drawing.Color]::FromArgb(90,170,230,210),90)
  $g.FillPath($fill,$p)
  foreach ($line in @(@{W=12;A=30;R=20;G=92;B=88},@{W=6;A=230;R=255;G=255;B=255},@{W=2;A=130;R=140;G=205;B=190})) {
    $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb($line.A,$line.R,$line.G,$line.B),$line.W)
    $g.DrawPath($pen,$p);$pen.Dispose()
  }
  $bitmap.Save((Join-Path $assetRoot "glass-nav-$count.png"),[System.Drawing.Imaging.ImageFormat]::Png)
  $fill.Dispose();$p.Dispose();$g.Dispose();$bitmap.Dispose()
}
# Translucent luminous surface wash, clipped by native rounded containers.
$bitmap = New-Object System.Drawing.Bitmap 300,300
for($y=0;$y -lt 300;$y++) {
 for($x=0;$x -lt 300;$x++) {
  $white = [int](35 + 70*[Math]::Exp(-[Math]::Pow(($y-25)/27,2)) + 45*[Math]::Exp(-[Math]::Pow(($x-20)/32,2)))
  $bitmap.SetPixel($x,$y,[System.Drawing.Color]::FromArgb($white,255,255,255))
 }
}
$bitmap.Save((Join-Path $assetRoot 'glass-sheen.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Dispose()
