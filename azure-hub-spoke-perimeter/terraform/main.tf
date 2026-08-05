terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.70.0"
    }
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

# Central Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "rg-${var.prefix}-${var.environment}"
  location = var.location

  tags = {
    Environment = var.environment
    Project     = "Hub-and-Spoke-Perimeter"
    ManagedBy   = "Terraform"
  }
}

# 1. Hub Network Module
module "hub_network" {
  source              = "./modules/hub_network"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  prefix              = var.prefix
  hub_vnet_cidr       = var.hub_vnet_cidr
}

# 2. Azure Firewall Module
module "firewall" {
  source              = "./modules/firewall"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  prefix              = var.prefix
  subnet_id           = module.hub_network.firewall_subnet_id
}

# 3. Spoke Network & Workload VM Module
module "spoke_network" {
  source              = "./modules/spoke_network"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  prefix              = var.prefix
  spoke_vnet_cidr     = var.spoke1_vnet_cidr
  hub_vnet_id         = module.hub_network.hub_vnet_id
  hub_vnet_name       = module.hub_network.hub_vnet_name
  firewall_private_ip = module.firewall.firewall_private_ip
  admin_username      = var.admin_username
  admin_ssh_key       = var.admin_ssh_key
}

# 4. Application Gateway WAF Module
module "waf" {
  source              = "./modules/waf"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  prefix              = var.prefix
  subnet_id           = module.hub_network.appgw_subnet_id
  backend_private_ip  = module.spoke_network.workload_vm_private_ip
}
