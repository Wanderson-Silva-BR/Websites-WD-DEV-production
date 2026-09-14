package com.wddev.betlock;

import java.util.Arrays;

final class DnsPacket {
    static final int UDP = 17;

    static final class Query {
        final byte[] srcIp;
        final byte[] dstIp;
        final int srcPort;
        final int dstPort;
        final byte[] dnsPayload;
        final String host;

        Query(byte[] srcIp, byte[] dstIp, int srcPort, int dstPort, byte[] dnsPayload, String host) {
            this.srcIp = srcIp;
            this.dstIp = dstIp;
            this.srcPort = srcPort;
            this.dstPort = dstPort;
            this.dnsPayload = dnsPayload;
            this.host = host;
        }
    }

    static Query parseIpv4UdpDns(byte[] packet, int length) {
        if (length < 40) return null;
        int version = (packet[0] >>> 4) & 0x0F;
        if (version != 4) return null;
        int ihl = (packet[0] & 0x0F) * 4;
        if (ihl < 20 || length < ihl + 8 + 12) return null;
        if ((packet[9] & 0xFF) != UDP) return null;
        int udp = ihl;
        int srcPort = u16(packet, udp);
        int dstPort = u16(packet, udp + 2);
        if (dstPort != 53) return null;
        int udpLen = u16(packet, udp + 4);
        int dnsLen = Math.min(udpLen - 8, length - udp - 8);
        if (dnsLen < 12) return null;
        byte[] dns = Arrays.copyOfRange(packet, udp + 8, udp + 8 + dnsLen);
        String host = parseQuestionName(dns);
        if (host.isEmpty()) return null;
        byte[] srcIp = Arrays.copyOfRange(packet, 12, 16);
        byte[] dstIp = Arrays.copyOfRange(packet, 16, 20);
        return new Query(srcIp, dstIp, srcPort, dstPort, dns, host);
    }

    static String parseQuestionName(byte[] dns) {
        if (dns.length < 13) return "";
        int qdCount = u16(dns, 4);
        if (qdCount < 1) return "";
        int p = 12;
        StringBuilder sb = new StringBuilder();
        int labels = 0;
        while (p < dns.length && labels++ < 128) {
            int n = dns[p++] & 0xFF;
            if (n == 0) break;
            if ((n & 0xC0) != 0 || n > 63 || p + n > dns.length) return "";
            if (sb.length() > 0) sb.append('.');
            for (int i = 0; i < n; i++) {
                int ch = dns[p++] & 0xFF;
                if (ch < 0x21 || ch > 0x7E) return "";
                sb.append((char) ch);
            }
        }
        return DomainMatcher.normalize(sb.toString());
    }

    static byte[] nxdomain(byte[] query) {
        if (query == null || query.length < 12) return new byte[0];
        byte[] r = Arrays.copyOf(query, query.length);
        int requestFlags = u16(query, 2);
        int flags = 0x8000 | 0x0080 | 0x0003;
        if ((requestFlags & 0x0100) != 0) flags |= 0x0100;
        put16(r, 2, flags);
        put16(r, 6, 0);
        put16(r, 8, 0);
        put16(r, 10, 0);
        return r;
    }

    static byte[] buildIpv4UdpResponse(Query q, byte[] dnsResponse) {
        int total = 20 + 8 + dnsResponse.length;
        byte[] out = new byte[total];
        out[0] = 0x45;
        out[1] = 0;
        put16(out, 2, total);
        put16(out, 4, 0);
        put16(out, 6, 0x4000);
        out[8] = 64;
        out[9] = UDP;
        System.arraycopy(q.dstIp, 0, out, 12, 4);
        System.arraycopy(q.srcIp, 0, out, 16, 4);
        put16(out, 10, checksum(out, 0, 20));
        int udp = 20;
        put16(out, udp, q.dstPort);
        put16(out, udp + 2, q.srcPort);
        put16(out, udp + 4, 8 + dnsResponse.length);
        put16(out, udp + 6, 0);
        System.arraycopy(dnsResponse, 0, out, udp + 8, dnsResponse.length);
        return out;
    }

    private static int checksum(byte[] b, int off, int len) {
        long sum = 0;
        int i = off;
        while (len > 1) {
            sum += ((b[i] & 0xFF) << 8) | (b[i + 1] & 0xFF);
            i += 2;
            len -= 2;
        }
        if (len > 0) sum += (b[i] & 0xFF) << 8;
        while ((sum >>> 16) != 0) sum = (sum & 0xFFFF) + (sum >>> 16);
        return (int) (~sum) & 0xFFFF;
    }

    private static int u16(byte[] b, int p) {
        return ((b[p] & 0xFF) << 8) | (b[p + 1] & 0xFF);
    }

    private static void put16(byte[] b, int p, int v) {
        b[p] = (byte) ((v >>> 8) & 0xFF);
        b[p + 1] = (byte) (v & 0xFF);
    }
}
