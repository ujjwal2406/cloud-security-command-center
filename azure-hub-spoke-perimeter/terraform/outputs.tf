output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "azure_firewall_private_ip" {
  value       = module.firewall.firewall_private_ip
  description = "Internal IP of Firewall forcing egress isolation"
}

output "azure_firewall_public_ip" {
  value       = module.firewall.firewall_public_ip
  description = "Egress Public IP of Azure Firewall"
}

output "appgw_waf_public_ip" {
  value       = module.waf.waf_public_ip
  description = "Public entry point IP for WAF protected web traffic"
}

output "internal_workload_private_ip" {
  value       = module.spoke_network.workload_vm_private_ip
  description = "Zero-Public-IP internal private workload address"
}
