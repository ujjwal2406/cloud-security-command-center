variable "resource_group_name" {
  type        = string
  description = "Name of the resource group"
}

variable "location" {
  type        = string
  description = "Azure Region"
}

variable "prefix" {
  type        = string
  description = "Resource naming prefix"
}

variable "spoke_vnet_cidr" {
  type        = string
  description = "CIDR block for Spoke VNet"
}

variable "hub_vnet_id" {
  type        = string
  description = "Resource ID of Hub VNet"
}

variable "hub_vnet_name" {
  type        = string
  description = "Name of Hub VNet"
}

variable "firewall_private_ip" {
  type        = string
  description = "Private IP of Azure Firewall for UDR Next Hop"
}

variable "admin_username" {
  type        = string
  description = "Admin username for test workload VM"
}

variable "admin_ssh_key" {
  type        = string
  description = "SSH public key string for test workload VM"
}
