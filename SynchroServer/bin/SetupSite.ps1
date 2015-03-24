# See: https://nodejstools.codeplex.com/workitem/479
#
$configFile = "$env:RdRoleRoot\RoleModel.xml"
$config = New-Object System.Xml.XmlDocument
$config.load($configFile)

$nsmgr = New-Object System.Xml.XmlNamespaceManager($config.NameTable);
$nsmgr.AddNamespace("sd", "http://schemas.microsoft.com/ServiceHosting/2008/10/ServiceDefinition")

$xpath = $config.CreateNavigator()
$physicalDir = $xpath.SelectSingleNode("//sd:Sites/sd:Site[@name='Web']", $nsmgr).GetAttribute("physicalDirectory", "") 

$siteRoot = join-path $env:RdRoleRoot $physicalDir

copy $pwd\..\web.cloud.config $siteRoot\web.config