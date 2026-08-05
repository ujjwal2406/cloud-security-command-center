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

variable "subnet_id" {
  type        = string
  description = "Resource ID of the AzureFirewallSubnet"
}
