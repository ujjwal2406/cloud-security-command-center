terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.70.0"
    }
  }
}

resource "azurerm_public_ip" "fw_pip" {
  name                = "pip-${var.prefix}-firewall"
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = "Static"
  sku                 = "Standard"

  tags = {
    Environment = "Production"
    Role        = "Perimeter-Egress"
  }
}

resource "azurerm_firewall_policy" "fw_policy" {
  name                = "afwp-${var.prefix}-policy"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = "Standard"

  threat_intelligence_mode = "Alert"
}

resource "azurerm_firewall_policy_rule_collection_group" "network_rules" {
  name               = "DefaultNetworkRuleCollectionGroup"
  firewall_policy_id = azurerm_firewall_policy.fw_policy.id
  priority           = 200

  network_rule_collection {
    name     = "AllowOutboundHTTPS"
    priority = 200
    action   = "Allow"

    rule {
      name                  = "AllowHTTPSandHTTP"
      protocols             = ["TCP"]
      source_addresses      = ["10.0.0.0/8"]
      destination_addresses = ["*"]
      destination_ports     = ["80", "443"]
    }
  }
}

resource "azurerm_firewall" "hub_fw" {
  name                = "afw-${var.prefix}-hub"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku_name            = "AZFW_VNet"
  sku_tier            = "Standard"
  firewall_policy_id  = azurerm_firewall_policy.fw_policy.id

  ip_configuration {
    name                 = "configuration"
    subnet_id            = var.subnet_id
    public_ip_address_id = azurerm_public_ip.fw_pip.id
  }

  tags = {
    Environment = "Production"
    Role        = "Central-Egress-Firewall"
  }
}
