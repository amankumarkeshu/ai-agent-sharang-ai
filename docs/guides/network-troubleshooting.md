# Network Troubleshooting Guide

## Common Network Issues and Solutions

### WiFi Connectivity Problems

**Symptoms:**
- Unable to connect to wireless network
- Intermittent connection drops
- Slow network speeds

**Solutions:**

1. **Check WiFi Signal Strength**
   - Move closer to the router
   - Remove physical obstructions
   - Check for interference from other devices

2. **Restart Network Devices**
   - Turn off the router and modem
   - Wait 30 seconds
   - Turn on modem first, wait for full boot
   - Turn on router and wait for connection

3. **Update Network Drivers**
   - Open Device Manager (Windows) or System Preferences (Mac)
   - Locate Network Adapters
   - Right-click and select "Update Driver"
   - Restart computer after update

4. **Reset Network Settings**
   - Windows: `netsh winsock reset` and `netsh int ip reset`
   - Mac: Delete network preferences and reconnect
   - Linux: `sudo systemctl restart NetworkManager`

### Internet Connectivity Issues

**Diagnosis Steps:**

1. **Check Physical Connections**
   - Verify all cables are properly connected
   - Check for damaged cables
   - Ensure modem/router power lights are on

2. **Test Connectivity**
   ```
   ping 8.8.8.8
   ping google.com
   ```
   - If first ping works but second fails, DNS issue
   - If both fail, connection issue

3. **DNS Configuration**
   - Use reliable DNS servers (Google DNS: 8.8.8.8, 8.8.4.4)
   - Cloudflare DNS: 1.1.1.1, 1.0.0.1
   - Flush DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### VPN Connection Problems

**Common Issues:**

1. **VPN Won't Connect**
   - Verify VPN credentials
   - Check firewall settings
   - Ensure VPN server address is correct
   - Try different VPN protocol (OpenVPN, L2TP, IKEv2)

2. **Slow VPN Performance**
   - Connect to a closer VPN server
   - Change VPN protocol
   - Check local internet speed
   - Disable unnecessary encryption if permitted

### Network Speed Issues

**Optimization Steps:**

1. **Run Speed Test**
   - Use speedtest.net or fast.com
   - Test at different times of day
   - Compare with ISP promised speeds

2. **Identify Bandwidth Hogs**
   - Check Task Manager (Windows) or Activity Monitor (Mac)
   - Look for processes using high network bandwidth
   - Pause downloads/uploads during important tasks

3. **Router Optimization**
   - Change WiFi channel to less congested one
   - Update router firmware
   - Position router centrally
   - Use 5GHz band for faster speeds (shorter range)

## Advanced Troubleshooting

### IP Configuration Issues

**Check IP Settings:**
```
Windows: ipconfig /all
Mac/Linux: ifconfig or ip addr show
```

**Renew IP Address:**
```
Windows: ipconfig /release && ipconfig /renew
Mac/Linux: sudo dhclient -r && sudo dhclient
```

### Network Adapter Problems

1. **Reset Network Adapter**
   - Disable and re-enable in Device Manager
   - Uninstall and reinstall driver
   - Roll back to previous driver if issues started after update

2. **Hardware Diagnostics**
   - Test with different network port
   - Try external USB network adapter
   - Check for firmware updates

## Prevention Tips

- Keep network drivers updated
- Regularly restart router/modem (monthly)
- Use strong WiFi passwords
- Enable WPA3 encryption if available
- Monitor network for unauthorized devices
- Document network configuration for future reference

## When to Escalate

Contact network administrator or ISP if:
- Multiple devices affected
- ISP modem/router hardware failure
- Need to configure advanced network settings
- Persistent issues after following all troubleshooting steps
- Suspected security breach or intrusion

