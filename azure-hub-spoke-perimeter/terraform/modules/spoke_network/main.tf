terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.70.0"
    }
  }
}

resource "azurerm_virtual_network" "spoke" {
  name                = "vnet-${var.prefix}-spoke1"
  location            = var.location
  resource_group_name = var.resource_group_name
  address_space       = [var.spoke_vnet_cidr]

  tags = {
    Environment = "Production"
    Role        = "Spoke-Workload"
    ManagedBy   = "Terraform"
  }
}

resource "azurerm_subnet" "workload" {
  name                 = "snet-workload"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.spoke.name
  address_prefixes     = [cidrsubnet(var.spoke_vnet_cidr, 8, 1)] # e.g. 10.1.1.0/24
}

# User Defined Route (UDR) - Forced Tunneling 0.0.0.0/0 to Firewall
resource "azurerm_route_table" "udr_egress" {
  name                = "rt-${var.prefix}-spoke-egress"
  location            = var.location
  resource_group_name = var.resource_group_name

  route {
    name                   = "ForceTrafficToFirewall"
    address_prefix         = "0.0.0.0/0"
    next_hop_type          = "VirtualAppliance"
    next_hop_in_ip_address = var.firewall_private_ip
  }

  tags = {
    Environment = "Production"
    Role        = "Forced-Egress-UDR"
  }
}

resource "azurerm_subnet_route_table_association" "workload_udr_assoc" {
  subnet_id      = azurerm_subnet.workload.id
  route_table_id = azurerm_route_table.udr_egress.id
}

# Zero Trust Network Security Group (NSG)
resource "azurerm_network_security_group" "workload_nsg" {
  name                = "nsg-${var.prefix}-workload"
  location            = var.location
  resource_group_name = var.resource_group_name

  security_rule {
    name                       = "AllowInternalVNetInbound"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "VirtualNetwork"
  }

  security_rule {
    name                       = "DenyDirectInternetInbound"
    priority                   = 4000
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "workload_nsg_assoc" {
  subnet_id                 = azurerm_subnet.workload.id
  network_security_group_id = azurerm_network_security_group.workload_nsg.id
}

# Bi-directional VNet Peering between Hub and Spoke
resource "azurerm_virtual_network_peering" "hub_to_spoke" {
  name                      = "peering-hub-to-spoke1"
  resource_group_name       = var.resource_group_name
  virtual_network_name      = var.hub_vnet_name
  remote_virtual_network_id = azurerm_virtual_network.spoke.id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
}

resource "azurerm_virtual_network_peering" "spoke_to_hub" {
  name                      = "peering-spoke1-to-hub"
  resource_group_name       = var.resource_group_name
  virtual_network_name      = azurerm_virtual_network.spoke.name
  remote_virtual_network_id = var.hub_vnet_id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
}

# Internal Workload NIC (NO PUBLIC IP)
resource "azurerm_network_interface" "vm_nic" {
  name                = "nic-${var.prefix}-workload01"
  location            = var.location
  resource_group_name = var.resource_group_name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.workload.id
    private_ip_address_allocation = "Dynamic"
  }
}

# Workload VM (No Public IP assigned)
resource "azurerm_linux_virtual_machine" "workload_vm" {
  name                = "vm-${var.prefix}-workload01"
  resource_group_name = var.resource_group_name
  location            = var.location
  size                = "Standard_B2s"
  admin_username      = var.admin_username

  network_interface_ids = [
    azurerm_network_interface.vm_nic.id,
  ]

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.admin_ssh_key
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }

  tags = {
    Environment = "Production"
    Role        = "Isolated-Internal-Workload"
  }
}
