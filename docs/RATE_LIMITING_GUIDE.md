# Rate Limiting Guide for Production

## Current Configuration

- **Global Rate Limit**: 100 requests per 15 minutes per IP
- **Speed Limiter**: 50 requests per 15 minutes, then 500ms delay per request
- **Auth Rate Limit**: 5 requests per 15 minutes (separate, more restrictive)
- **Window**: 15 minutes (900,000ms)

## Impact of Increasing to 1000

### What Changes:
- Each IP can make **1000 requests per 15 minutes** (vs 100 currently)
- That's approximately **66 requests per minute** or **1.1 requests per second** per IP
- The speed limiter still activates at 50 requests, adding 500ms delays

### Risks:
1. **Single IP Abuse**: A malicious user can make 10x more requests before being blocked
2. **Resource Consumption**: Higher database/CPU load from legitimate heavy users
3. **DDoS Vulnerability**: Easier for attackers to overwhelm the server
4. **Cost Implications**: More requests = more server resources = higher costs

### Benefits:
1. **Better UX**: Legitimate power users won't hit limits as easily
2. **API-Friendly**: Better for automated tools and integrations
3. **Reduced False Positives**: Fewer legitimate users blocked

## Recommended Production Settings

### Option 1: Conservative (Recommended for Most APIs)
```env
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes
RATE_LIMIT_MAX_REQUESTS=200          # 200 requests per 15 min (~13/min)
SPEED_LIMIT_WINDOW_MS=900000
# Speed limiter: delayAfter=100, delayMs=500
```

**Why**: Balances security with usability. Good for:
- Small to medium user bases
- APIs with moderate traffic
- When security is a priority

### Option 2: Moderate (Recommended for Active Communities)
```env
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes
RATE_LIMIT_MAX_REQUESTS=500          # 500 requests per 15 min (~33/min)
SPEED_LIMIT_WINDOW_MS=900000
# Speed limiter: delayAfter=200, delayMs=500
```

**Why**: Allows more activity while maintaining protection. Good for:
- Active user communities
- APIs with regular heavy usage
- When you have good monitoring

### Option 3: High Traffic (Only if You Have Infrastructure)
```env
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes
RATE_LIMIT_MAX_REQUESTS=1000         # 1000 requests per 15 min (~66/min)
SPEED_LIMIT_WINDOW_MS=900000
# Speed limiter: delayAfter=300, delayMs=500
```

**Why**: Maximum flexibility for power users. Only use if:
- You have robust infrastructure (load balancing, auto-scaling)
- You have comprehensive monitoring and alerting
- You can handle DDoS attacks at the infrastructure level
- You have a large, active user base

## Industry Standards

### General API Best Practices:
- **Public APIs**: 100-200 requests per 15 minutes
- **Authenticated APIs**: 500-1000 requests per 15 minutes
- **Internal APIs**: 1000+ requests per 15 minutes

### Popular Services:
- **GitHub API**: 5,000 requests/hour for authenticated (83/min)
- **Twitter API**: Varies by tier (300-900 requests per 15 min)
- **Stripe API**: 100 requests per second (but with burst capacity)

## Implementation Recommendations

### 1. Tiered Rate Limiting (Best Practice)

Implement different limits based on:
- **Anonymous users**: 100-200 requests/15min
- **Authenticated users**: 500-1000 requests/15min
- **Admin users**: Higher limits or no limit
- **API keys**: Custom limits per key

### 2. Adjust Speed Limiter

If you increase the rate limit, also adjust the speed limiter:

```javascript
// Current: delayAfter: 50
// For 200 limit: delayAfter: 100
// For 500 limit: delayAfter: 200
// For 1000 limit: delayAfter: 300
```

### 3. Monitor and Adjust

Track these metrics:
- Rate limit hit rate (% of requests blocked)
- Average requests per user per hour
- Peak traffic patterns
- False positive rate (legitimate users blocked)

### 4. Consider Redis for Distributed Systems

If you're running multiple server instances, ensure rate limiting uses Redis for shared state:

```javascript
const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
  }),
  // ... other config
});
```

## Recommended Production Configuration

For a **robotics club management system** with moderate to high activity:

```env
# Global Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=300

# Speed Limiting (adjust delayAfter in code)
SPEED_LIMIT_WINDOW_MS=900000
# delayAfter: 150 (50% of rate limit)
# delayMs: 500

# Auth Rate Limiting (keep strict)
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5
AUTH_RATE_LIMIT_RETRY_AFTER=15
```

**Rationale**:
- 300 requests/15min = 20 requests/min = reasonable for active users
- Still provides good protection against abuse
- Speed limiter at 150 provides progressive throttling
- Auth endpoints remain strictly protected

## Migration Strategy

1. **Start Conservative**: Begin with 200-300 requests/15min
2. **Monitor for 1-2 weeks**: Track hit rates and user complaints
3. **Adjust Gradually**: Increase by 100-200 if needed
4. **Set Alerts**: Alert when rate limit hits exceed 5% of total requests
5. **Review Quarterly**: Reassess based on traffic patterns

## Additional Security Measures

Even with higher rate limits, maintain:
- ✅ IP-based blocking for repeat offenders
- ✅ Authentication rate limiting (keep strict at 5)
- ✅ Request size limits (already set at 10mb)
- ✅ Input validation and sanitization
- ✅ DDoS protection at infrastructure level (Cloudflare, AWS Shield, etc.)
- ✅ Monitoring and alerting for unusual patterns

