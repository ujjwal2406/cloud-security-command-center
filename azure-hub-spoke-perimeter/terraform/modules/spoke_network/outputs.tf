output "spoke_vnet_id" {
  value = azurerm_virtual_network.spoke.id
}

output "workload_subnet_id" {
  value = azurerm_subnet.workload.id
}

output "workload_vm_private_ip" {
  value       = azurerm_network_interface.vm_nic.private_ip_address
  description = "Private IP of internal workload VM"
}
