terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.70.0"
    }
  }
}

resource "azurerm_public_ip" "appgw_pip" {
  name                = "pip-${var.prefix}-appgw"
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_web_application_firewall_policy" "waf_policy" {
  name                = "wafp-${var.prefix}-owasp"
  resource_group_name = var.resource_group_name
  location            = var.location

  policy_settings {
    enabled            = true
    mode               = "Prevention"
    request_body_check = true
    max_request_body_size_in_kb = 128
    file_upload_limit_in_mb     = 100
  }

  managed_rules {
    managed_rule_set {
      type    = "OWASP"
      version = "3.2"
    }
  }

  tags = {
    Environment = "Production"
    Role        = "Layer7-WAF-Policy"
  }
}

resource "azurerm_application_gateway" "appgw" {
  name                = "agw-${var.prefix}-waf"
  resource_group_name = var.resource_group_name
  location            = var.location

  sku {
    name     = "WAF_v2"
    tier     = "WAF_v2"
    capacity = 2
  }

  firewall_policy_id = azurerm_web_application_firewall_policy.waf_policy.id

  gateway_ip_configuration {
    name      = "appGatewayIpConfig"
    subnet_id = var.subnet_id
  }

  frontend_port {
    name = "frontendPortHTTP"
    port = 80
  }

  frontend_ip_configuration {
    name                 = "frontendPublicIp"
    public_ip_address_id = azurerm_public_ip.appgw_pip.id
  }

  backend_address_pool {
    name         = "backendWorkloadPool"
    ip_addresses = [var.backend_private_ip]
  }

  backend_http_settings {
    name                  = "httpSettings"
    cookie_based_affinity = "Disabled"
    port                  = 80
    protocol              = "Http"
    request_timeout       = 20
  }

  http_listener {
    name                           = "httpListener"
    frontend_ip_configuration_name = "frontendPublicIp"
    frontend_port_name             = "frontendPortHTTP"
    protocol                       = "Http"
  }

  request_routing_rule {
    name                       = "ruleHttpPassThrough"
    rule_type                  = "Basic"
    http_listener_name         = "httpListener"
    backend_address_pool_name  = "backendWorkloadPool"
    backend_http_settings_name = "httpSettings"
    priority                   = 100
  }

  tags = {
    Environment = "Production"
    Role        = "Public-Web-Perimeter"
  }
}
