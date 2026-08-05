variable "environment" {
  type        = string
  description = "Target deployment environment (e.g. prod, dev, staging)"
  default     = "prod"
}

variable "location" {
  type        = string
  description = "Azure Region for infrastructure deployment"
  default     = "eastus2"
}

variable "prefix" {
  type        = string
  description = "Resource naming prefix"
  default     = "cloudsec-hubspoke"
}

variable "hub_vnet_cidr" {
  type        = string
  description = "CIDR block for Hub Virtual Network"
  default     = "10.0.0.0/16"
}

variable "spoke1_vnet_cidr" {
  type        = string
  description = "CIDR block for Spoke 1 Workload Virtual Network"
  default     = "10.1.0.0/16"
}

variable "admin_username" {
  type        = string
  description = "Admin username for internal test VM"
  default     = "secopsadmin"
}

variable "admin_ssh_key" {
  type        = string
  description = "SSH public key string for internal test VM access"
  sensitive   = true
}
