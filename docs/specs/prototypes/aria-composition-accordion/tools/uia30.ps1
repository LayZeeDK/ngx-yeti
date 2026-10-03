# PROTOTYPE (ticket 30): dumps the UI Automation tree under the document of the window titled "UIAPROBE*".
# Run with Windows PowerShell 5.1 (powershell.exe), which ships UIAutomationClient.
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
$root = [System.Windows.Automation.AutomationElement]::RootElement
$cond = [System.Windows.Automation.Condition]::TrueCondition
$win = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $cond) | Where-Object { $_.Current.Name -like 'UIAPROBE*' } | Select-Object -First 1
if (-not $win) { Write-Output 'NO WINDOW'; exit 1 }
Write-Output ("window: " + $win.Current.Name + " class=" + $win.Current.ClassName + " fw=" + $win.Current.FrameworkId)
$walker = [System.Windows.Automation.TreeWalker]::ControlViewWalker
function Dump($el, $depth) {
  if ($depth -gt 40) { return }
  $c = $el.Current
  $exp = ''
  $p = $null
  if ($el.TryGetCurrentPattern([System.Windows.Automation.ExpandCollapsePattern]::Pattern, [ref]$p)) { $exp = ' expand=' + $p.Current.ExpandCollapseState }
  $line = ('  ' * $depth) + $c.ControlType.ProgrammaticName.Replace('ControlType.', '') + ' [' + $c.LocalizedControlType + '] "' + $c.Name + '"' + $exp
  if ($c.AriaRole) { $line += ' ariaRole=' + $c.AriaRole }
  if ($c.AriaProperties) { $line += ' aria=' + $c.AriaProperties }
  $script:out += $line
  $ch = $walker.GetFirstChild($el)
  while ($ch) { Dump $ch ($depth + 1); $ch = $walker.GetNextSibling($ch) }
}
$script:out = @()
Dump $win 0
$script:out | Where-Object { $_ -match 'Does Yeti|Can I use|Almost never|heading|group|accordion|Document' } | ForEach-Object { $_ }
