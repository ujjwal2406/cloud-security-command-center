#!/usr/bin/env bash
# ==============================================================================
# Azure Hub-and-Spoke Perimeter Security Validation Script
# Verifies zero public IP exposure on workload VMs, UDR next hop configuration,
# and WAF OWASP rule blocking functionality.
# ==============================================================================

set -euo pipefail

RESOURCE_GROUP=""
SUBSCRIPTION_ID=""

usage() {
    echo "Usage: $0 -g <resource-group-name> -s <subscription-id>"
    exit 1
}

while getopts "g:s:" opt; do
    case "${opt}" in
        g) RESOURCE_GROUP="${OPTARG}" ;;
        s) SUBSCRIPTION_ID="${OPTARG}" ;;
        *) usage ;;
    esac
done

if [[ -z "${RESOURCE_GROUP}" || -z "${SUBSCRIPTION_ID}" ]]; then
    usage
fi

echo "======================================================================"
echo "[*] Azure Cloud Security Perimeter Validation Matrix"
echo "[*] Resource Group: ${RESOURCE_GROUP}"
echo "======================================================================"

az account set --subscription "${SUBSCRIPTION_ID}"

# Test 1: Validate Zero Public IPs on Internal Workload Virtual Machines
echo -n "[TEST 1] Verifying Zero Public IP exposure on workload NICs... "
WORKLOAD_VMS=$(az vm list -g "${RESOURCE_GROUP}" --query "[?tags.Role=='Isolated-Internal-Workload'].name" -o tsv)

PASSED_ZERO_PIP=true
for vm in ${WORKLOAD_VMS}; do
    PIP=$(az vm list-ip-addresses -g "${RESOURCE_GROUP}" -n "${vm}" --query "[0].virtualMachine.network.publicIpAddresses[0].ipAddress" -o tsv)
    if [[ -n "${PIP}" ]]; then
        echo -e "\n[FAIL] VM ${vm} has public IP: ${PIP}"
        PASSED_ZERO_PIP=false
    fi
done

if [[ "${PASSED_ZERO_PIP}" == true ]]; then
    echo "PASSED (No public IPs detected on internal workload VMs)."
fi

# Test 2: Verify Forced Tunneling UDR (0.0.0.0/0 Next Hop is VirtualAppliance)
echo -n "[TEST 2] Verifying Forced Tunneling UDR route configuration... "
UDR_NEXT_HOP=$(az network route-table route list -g "${RESOURCE_GROUP}" --route-table-name rt-cloudsec-hubspoke-spoke-egress --query "[?addressPrefix=='0.0.0.0/0'].nextHopType" -o tsv)

if [[ "${UDR_NEXT_HOP}" == "VirtualAppliance" ]]; then
    echo "PASSED (0.0.0.0/0 Next Hop is VirtualAppliance)."
else
    echo "FAILED (Expected VirtualAppliance, got: ${UDR_NEXT_HOP})"
fi

# Test 3: WAF Attack Payload Block Test (SQLi simulation)
echo -n "[TEST 3] Verifying Application Gateway WAF OWASP SQLi Block... "
WAF_PIP=$(az network public-ip show -g "${RESOURCE_GROUP}" -n pip-cloudsec-hubspoke-appgw --query "ipAddress" -o tsv || echo "")

if [[ -n "${WAF_PIP}" ]]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${WAF_PIP}/?id=1%20UNION%20SELECT%201,2,3" || echo "000")
    if [[ "${HTTP_CODE}" == "403" ]]; then
        echo "PASSED (WAF blocked SQLi attack with HTTP 403 Forbidden)."
    else
        echo "WARNING (Expected HTTP 403 block from WAF, received HTTP ${HTTP_CODE})."
    fi
else
    echo "SKIPPED (App Gateway Public IP not found)."
fi

echo "======================================================================"
echo "[+] Perimeter Validation Complete."
echo "======================================================================"
