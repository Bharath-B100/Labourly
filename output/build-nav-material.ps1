Add-Type -AssemblyName System.Drawing
$assetRoot = 'D:/Files/EDUCATION/NammaCrew/mobile/assets'
foreach ($count in @(4,5)) {
 $w=$count*200; $b=[System.Drawing.Bitmap]::new($w,210); $g=[System.Drawing.Graphics]::FromImage($b)
 $g.SmoothingMode='AntiAlias'; $p=[System.Drawing.Drawing2D.GraphicsPath]::new()
 $p.StartFigure(); $p.AddBezier(3,105,3,25,88,-18,150,30)
 for($i=1;$i -lt $count;$i++) { $x=$i*200; $p.AddBezier($x-50,30,$x-12,62,$x-12,62,$x,62); $p.AddBezier($x,62,$x+12,62,$x+12,62,$x+50,30); $p.AddBezier($x+50,30,$x+82,3,$x+118,3,$x+150,30) }
 $p.AddBezier($w-50,30,$w+10,72,$w+10,142,$w-50,180)
 for($i=$count-1;$i -gt 0;$i--) { $x=$i*200; $p.AddBezier($x+150,180,$x+118,207,$x+82,207,$x+50,180); $p.AddBezier($x+50,180,$x+12,148,$x+12,148,$x,148); $p.AddBezier($x,148,$x-12,148,$x-12,148,$x-50,180) }
 $p.AddBezier(150,180,88,228,3,185,3,105); $p.CloseFigure()
 $r=[System.Drawing.Rectangle]::new(0,0,$w,210)
 $brush=[System.Drawing.Drawing2D.LinearGradientBrush]::new($r,[System.Drawing.Color]::White,[System.Drawing.Color]::White,90)
 $blend=[System.Drawing.Drawing2D.ColorBlend]::new(5)
 $blend.Positions=[single[]]@(0,0.15,0.48,0.78,1)
 $blend.Colors=[System.Drawing.Color[]]@([System.Drawing.Color]::FromArgb(200,255,255,255),[System.Drawing.Color]::FromArgb(90,217,248,236),[System.Drawing.Color]::FromArgb(38,245,255,250),[System.Drawing.Color]::FromArgb(100,198,238,224),[System.Drawing.Color]::FromArgb(210,255,255,248))
 $brush.InterpolationColors=$blend; $g.FillPath($brush,$p)
 foreach($spec in @(@(12,35,32,133,119),@(6,240,255,255,255),@(2,95,54,149,133))) { $pen=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb($spec[1],$spec[2],$spec[3],$spec[4]),$spec[0]); $g.DrawPath($pen,$p); $pen.Dispose() }
 $inner=$p.Clone(); $matrix=[System.Drawing.Drawing2D.Matrix]::new(); $matrix.Translate(4,9); $matrix.Scale([single](($w-8)/$w),[single](192/210)); $inner.Transform($matrix)
 $pen=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(200,255,255,255),5); $g.DrawPath($pen,$inner)
 $b.Save((Join-Path $assetRoot "glass-nav-$count.png"),[System.Drawing.Imaging.ImageFormat]::Png)
 $pen.Dispose(); $inner.Dispose(); $matrix.Dispose(); $brush.Dispose(); $p.Dispose(); $g.Dispose(); $b.Dispose()
}
# Full-size amber lens with curved specular reflections and transparent outside.
$b=[System.Drawing.Bitmap]::new(240,240)
for($y=0;$y -lt 240;$y++) { for($x=0;$x -lt 240;$x++) {
 $dx=($x-119.5)/117; $dy=($y-119.5)/117; $r=[Math]::Sqrt($dx*$dx+$dy*$dy)
 if($r -gt 1) {continue}
 $edge=[Math]::Exp(-[Math]::Pow(($r-.966)/.012,2))
 $rim=[Math]::Exp(-[Math]::Pow(($r-.90)/.025,2))*(.55+.45*[Math]::Abs($dy))
 $shine=[Math]::Exp(-[Math]::Pow(($dx+.30)/.60,2)-[Math]::Pow(($dy+.65)/.25,2))
 $white=[Math]::Min(1,$edge*.98+$rim*.75+$shine*.72)
 $red=255; $green=[int](209+46*$white); $blue=[int](52+203*$white)
 $alpha=[int]([Math]::Min(1,(1-$r)*170)*(205+50*$white))
 $b.SetPixel($x,$y,[System.Drawing.Color]::FromArgb($alpha,$red,$green,$blue))
} }
$b.Save((Join-Path $assetRoot 'glass-nav-selected.png'),[System.Drawing.Imaging.ImageFormat]::Png);$b.Dispose()
