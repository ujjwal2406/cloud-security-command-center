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

variable "hub_vnet_cidr" {
  type        = string
  description = "CIDR block for Hub VNet"
}
