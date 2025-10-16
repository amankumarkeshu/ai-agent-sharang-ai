# OpenAI Integration Setup Guide

This guide explains how to set up OpenAI integration for intelligent ticket triage in the IntelliOps AI Co-Pilot application.

## Prerequisites

1. **OpenAI Account**: Sign up at [OpenAI Platform](https://platform.openai.com/)
2. **API Key**: Generate an API key from your OpenAI dashboard
3. **Billing Setup**: Ensure you have billing configured (OpenAI API is pay-per-use)

## Step 1: Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the generated key (you won't be able to see it again)

## Step 2: Configure Environment Variables

### For Local Development

Set the following environment variables:

```bash
export OPENAI_API_KEY="your-openai-api-key-here"
export OPENAI_MODEL="gpt-3.5-turbo"  # or "gpt-4" for better results
export AI_PROVIDER="openai"
```

### For Docker Deployment

Update your `.env` file or `docker-compose.yml`:

```env
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
AI_PROVIDER=openai
```

## Step 3: Available Models

Choose the appropriate model based on your needs:

### GPT-3.5 Turbo (Recommended for most use cases)
- **Model**: `gpt-3.5-turbo`
- **Cost**: Lower cost
- **Speed**: Faster responses
- **Use case**: General ticket triage

### GPT-4 (Best quality)
- **Model**: `gpt-4`
- **Cost**: Higher cost
- **Speed**: Slower responses
- **Use case**: Complex ticket analysis requiring higher accuracy

### GPT-4 Turbo
- **Model**: `gpt-4-1106-preview`
- **Cost**: Moderate
- **Speed**: Good balance
- **Use case**: Best balance of cost, speed, and quality

## Step 4: AI Triage Features

Once configured, the AI will provide:

### Automatic Categorization
- **Network Issue**: WiFi, internet, connectivity problems
- **Hardware Issue**: Computer, printer, monitor problems
- **Software Issue**: Application, installation, update issues
- **Security Issue**: Virus, malware, access problems
- **Performance Issue**: Slow systems, crashes, freezing
- **Other**: Miscellaneous issues

### Priority Assignment
- **Critical**: System outages, security breaches
- **High**: Important issues affecting productivity
- **Medium**: Standard issues with moderate impact
- **Low**: Minor issues, enhancement requests

### Technician Suggestions
AI suggests appropriate technicians based on:
- Issue category
- Technician expertise
- Current workload (future enhancement)

### Confidence Scoring
- AI provides confidence score (0.0 to 1.0)
- Higher scores indicate more certain categorization
- Use for quality assurance and manual review triggers

## Step 5: Testing the Integration

### 1. Create a Test Ticket

Use the frontend to create a ticket with:
- **Title**: "WiFi not working in conference room"
- **Description**: "Users cannot connect to the wireless network in the main conference room. The network appears in the list but authentication fails."

### 2. Expected AI Response

```json
{
  "category": "Network Issue",
  "summary": "WiFi connectivity issue in conference room with authentication failures",
  "priority": "high",
  "suggestedTechnician": "Ravi Kumar",
  "confidence": 0.92,
  "reasoning": "Clear network connectivity issue with specific location and symptoms described"
}
```

### 3. API Testing with curl

```bash
# Get auth token first
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@intelliops.com","password":"password"}' \
  | jq -r '.token')

# Test AI triage
curl -X POST http://localhost:8080/api/ai/triage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Server is down",
    "description": "The main application server is not responding to requests"
  }'
```

## Step 6: Cost Management

### Monitor Usage
- Check your OpenAI dashboard regularly
- Set up billing alerts
- Monitor token usage in application logs

### Optimize Costs
1. **Use GPT-3.5-turbo** for most cases
2. **Implement caching** for similar tickets
3. **Set request limits** to prevent abuse
4. **Use fallback to mock responses** when API is unavailable

### Token Estimation
- Average ticket triage: ~200-500 tokens
- Cost per request: $0.001-0.003 (GPT-3.5-turbo)
- 1000 tickets/month ≈ $1-3

## Step 7: Error Handling

The application handles OpenAI errors gracefully:

### API Key Issues
- Invalid or missing API key
- Fallback to mock triage responses
- Error logged for debugging

### Rate Limiting
- OpenAI rate limits exceeded
- Automatic retry with exponential backoff
- Fallback to mock responses after retries

### Network Issues
- Connection timeouts
- Service unavailable
- Graceful degradation to keyword-based triage

## Step 8: Advanced Configuration

### Custom Prompts
Modify the AI prompt in `backend/handlers/ai.go`:

```go
prompt := fmt.Sprintf(`
You are an expert IT support specialist for a managed service provider.
Analyze this ticket and provide structured triage information:

Title: %s
Description: %s

Consider the business impact and urgency when assigning priority.
Focus on accurate categorization for efficient technician assignment.

Respond with JSON containing:
- category: [specific categories]
- summary: [brief analysis]
- priority: [based on business impact]
- suggestedTechnician: [based on expertise]
- confidence: [0.0-1.0]
- reasoning: [explanation]
`, req.Title, req.Description)
```

### Temperature Settings
Adjust creativity vs consistency:
- **0.0-0.3**: More consistent, deterministic responses
- **0.4-0.7**: Balanced creativity and consistency
- **0.8-1.0**: More creative but less predictable

## Troubleshooting

### Common Issues

1. **"Invalid API Key" Error**
   - Verify API key is correct
   - Check environment variable is set
   - Ensure no extra spaces or characters

2. **"Model not found" Error**
   - Check model name spelling
   - Verify model availability in your region
   - Use supported model names

3. **Rate Limit Exceeded**
   - Implement request queuing
   - Add delays between requests
   - Upgrade OpenAI plan if needed

4. **High Costs**
   - Monitor token usage
   - Implement request caching
   - Use cheaper models for simple cases

### Debug Mode

Enable debug logging:

```bash
export GIN_MODE=debug
export LOG_LEVEL=debug
```

Check logs for:
- API request/response details
- Token usage information
- Error messages and stack traces

## Security Best Practices

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables or secure vaults
   - Rotate keys regularly

2. **Request Validation**
   - Validate input data before sending to OpenAI
   - Sanitize user inputs
   - Implement rate limiting

3. **Data Privacy**
   - Review OpenAI's data usage policies
   - Consider data residency requirements
   - Implement data anonymization if needed

## Support

For issues with OpenAI integration:

1. Check OpenAI status page
2. Review application logs
3. Test with simple requests
4. Contact OpenAI support for API issues
5. Create GitHub issue for application-specific problems

## Next Steps

After successful setup:

1. **Monitor Performance**: Track triage accuracy
2. **Collect Feedback**: Get user feedback on AI suggestions
3. **Fine-tune Prompts**: Improve prompts based on results
4. **Scale Gradually**: Increase usage as confidence grows
5. **Consider Fine-tuning**: Train custom models for better accuracy
