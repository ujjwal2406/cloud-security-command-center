output "waf_public_ip" {
  value       = azurerm_public_ip.appgw_pip.ip_address
  description = "Public IP address of App Gateway WAF"
}

output "appgw_id" {
  value = azurerm_application_gateway.appgw.id
}
