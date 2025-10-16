# Local LLM Integration Setup Guide

This guide explains how to set up local Large Language Model (LLM) integration as an alternative to OpenAI for intelligent ticket triage in the IntelliOps AI Co-Pilot application.

## Why Use Local LLMs?

### Advantages
- **Privacy**: Data stays on your infrastructure
- **Cost Control**: No per-request charges after initial setup
- **Customization**: Fine-tune models for your specific use case
- **Offline Operation**: Works without internet connectivity
- **Compliance**: Meet strict data residency requirements

### Considerations
- **Hardware Requirements**: Requires significant GPU/CPU resources
- **Setup Complexity**: More complex than cloud APIs
- **Maintenance**: Need to manage model updates and infrastructure
- **Performance**: May be slower than cloud APIs

## Supported Local LLM Solutions

### 1. Ollama (Recommended for Beginners)

**Easy setup with good performance**

#### Installation
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

#### Setup
```bash
# Start Ollama service
ollama serve

# Pull a model (in another terminal)
ollama pull llama2:7b-chat
# or for better performance
ollama pull codellama:13b-instruct
```

#### Configuration
```bash
export LOCAL_LLM_URL="http://localhost:11434"
export AI_PROVIDER="local"
```

### 2. LM Studio

**User-friendly GUI for model management**

#### Installation
1. Download from [LM Studio](https://lmstudio.ai/)
2. Install and launch the application
3. Browse and download models from the built-in catalog

#### Recommended Models
- **Llama 2 7B Chat**: Good balance of performance and resource usage
- **Code Llama 13B**: Better for technical content
- **Mistral 7B Instruct**: Efficient and capable
- **Zephyr 7B Beta**: Good instruction following

#### Configuration
```bash
export LOCAL_LLM_URL="http://localhost:1234"
export AI_PROVIDER="local"
```

### 3. Text Generation WebUI (Advanced)

**Most flexible but requires more setup**

#### Installation
```bash
git clone https://github.com/oobabooga/text-generation-webui.git
cd text-generation-webui
pip install -r requirements.txt
```

#### Configuration
```bash
export LOCAL_LLM_URL="http://localhost:5000"
export AI_PROVIDER="local"
```

### 4. vLLM (Production)

**High-performance serving for production environments**

#### Installation
```bash
pip install vllm
```

#### Usage
```bash
python -m vllm.entrypoints.openai.api_server \
    --model microsoft/DialoGPT-medium \
    --port 8000
```

#### Configuration
```bash
export LOCAL_LLM_URL="http://localhost:8000"
export AI_PROVIDER="local"
```

## Hardware Requirements

### Minimum Requirements
- **RAM**: 16GB system RAM
- **Storage**: 50GB free space
- **CPU**: Modern multi-core processor

### Recommended for 7B Models
- **GPU**: 8GB VRAM (RTX 3070, RTX 4060 Ti, or better)
- **RAM**: 32GB system RAM
- **Storage**: 100GB SSD

### Recommended for 13B+ Models
- **GPU**: 16GB+ VRAM (RTX 4080, RTX 4090, or better)
- **RAM**: 64GB system RAM
- **Storage**: 200GB+ SSD

### Production Setup
- **Multiple GPUs**: For parallel processing
- **High-speed storage**: NVMe SSDs
- **Adequate cooling**: GPUs will run hot under load

## Model Selection Guide

### For Ticket Triage

#### Llama 2 7B Chat
- **Size**: ~4GB
- **Performance**: Good
- **Speed**: Fast
- **Use case**: General ticket classification

#### Code Llama 13B Instruct
- **Size**: ~7GB
- **Performance**: Better
- **Speed**: Moderate
- **Use case**: Technical issue analysis

#### Mistral 7B Instruct
- **Size**: ~4GB
- **Performance**: Excellent
- **Speed**: Fast
- **Use case**: Balanced performance

#### Zephyr 7B Beta
- **Size**: ~4GB
- **Performance**: Good instruction following
- **Speed**: Fast
- **Use case**: Structured output generation

## Configuration Steps

### Step 1: Choose and Install LLM Solution

Follow the installation instructions for your chosen solution above.

### Step 2: Configure Environment Variables

```bash
# Set AI provider to local
export AI_PROVIDER="local"

# Set local LLM URL (adjust port based on your setup)
export LOCAL_LLM_URL="http://localhost:11434"  # Ollama
# export LOCAL_LLM_URL="http://localhost:1234"   # LM Studio
# export LOCAL_LLM_URL="http://localhost:5000"   # Text Generation WebUI
# export LOCAL_LLM_URL="http://localhost:8000"   # vLLM

# Optional: Keep OpenAI as fallback
export OPENAI_API_KEY="your-openai-key"
export OPENAI_MODEL="gpt-3.5-turbo"
```

### Step 3: Update Docker Configuration (if using Docker)

Update `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - AI_PROVIDER=local
      - LOCAL_LLM_URL=http://host.docker.internal:11434
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
```

### Step 4: Test the Integration

#### Start Your Local LLM
```bash
# For Ollama
ollama serve

# For LM Studio
# Start through the GUI

# For Text Generation WebUI
python server.py --api --listen
```

#### Test API Endpoint
```bash
# Test if the local LLM is responding
curl -X POST http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2:7b-chat",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

#### Test Ticket Triage
```bash
# Get auth token
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@intelliops.com","password":"password"}' \
  | jq -r '.token')

# Test AI triage with local LLM
curl -X POST http://localhost:8080/api/ai/triage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Printer not working",
    "description": "The office printer is showing error messages and not printing documents"
  }'
```

## Performance Optimization

### Model Optimization

#### Quantization
Use quantized models for better performance:
- **Q4_0**: 4-bit quantization, good balance
- **Q5_0**: 5-bit quantization, better quality
- **Q8_0**: 8-bit quantization, highest quality

#### Example with Ollama
```bash
# Pull quantized model
ollama pull llama2:7b-chat-q4_0
```

### System Optimization

#### GPU Acceleration
Ensure your LLM solution uses GPU acceleration:

```bash
# Check GPU availability
nvidia-smi

# For Ollama with GPU
ollama pull llama2:7b-chat
# GPU will be used automatically if available
```

#### Memory Management
```bash
# Increase system limits if needed
ulimit -n 65536
```

### Caching
Implement response caching for similar tickets:

```go
// Example caching logic in Go
type TriageCache struct {
    cache map[string]*models.TriageResponse
    mutex sync.RWMutex
}

func (c *TriageCache) Get(key string) (*models.TriageResponse, bool) {
    c.mutex.RLock()
    defer c.mutex.RUnlock()
    response, exists := c.cache[key]
    return response, exists
}
```

## Monitoring and Maintenance

### Performance Monitoring

#### Response Times
Monitor average response times:
- **Target**: < 5 seconds for 7B models
- **Acceptable**: < 10 seconds for 13B models
- **Alert**: > 15 seconds

#### Resource Usage
Monitor system resources:
- **GPU utilization**: Should be high during inference
- **Memory usage**: Watch for memory leaks
- **CPU usage**: Monitor for bottlenecks

#### Quality Metrics
Track triage accuracy:
- **Confidence scores**: Average confidence levels
- **User feedback**: Manual review results
- **Category accuracy**: Correct categorization rate

### Model Updates

#### Regular Updates
```bash
# Update Ollama models
ollama pull llama2:7b-chat

# Check for new model versions
ollama list
```

#### A/B Testing
Test new models before deployment:
1. Deploy new model on separate endpoint
2. Route small percentage of traffic
3. Compare performance metrics
4. Gradually increase traffic if successful

## Troubleshooting

### Common Issues

#### 1. Model Loading Errors
```bash
# Check available models
ollama list

# Pull model if missing
ollama pull llama2:7b-chat
```

#### 2. Out of Memory Errors
- Reduce model size (use smaller model)
- Increase system RAM
- Use quantized models
- Reduce batch size

#### 3. Slow Response Times
- Check GPU utilization
- Use faster model (smaller size)
- Optimize system resources
- Consider model quantization

#### 4. Connection Errors
```bash
# Check if service is running
curl http://localhost:11434/api/tags

# Check firewall settings
sudo ufw status

# Check port availability
netstat -tlnp | grep 11434
```

### Debug Mode

Enable detailed logging:

```bash
export LOG_LEVEL=debug
export OLLAMA_DEBUG=1
```

## Security Considerations

### Network Security
- Run LLM on isolated network
- Use VPN for remote access
- Implement proper firewall rules

### Data Privacy
- Models process data locally
- No data sent to external services
- Implement data retention policies

### Access Control
- Restrict API access
- Use authentication tokens
- Monitor usage patterns

## Production Deployment

### High Availability

#### Load Balancing
```yaml
# docker-compose.yml
services:
  llm-1:
    image: ollama/ollama
    ports:
      - "11434:11434"
  
  llm-2:
    image: ollama/ollama
    ports:
      - "11435:11434"
  
  nginx:
    image: nginx
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
```

#### Health Checks
```bash
# Health check endpoint
curl http://localhost:11434/api/tags
```

### Backup and Recovery

#### Model Backup
```bash
# Backup Ollama models
cp -r ~/.ollama/models /backup/ollama-models
```

#### Configuration Backup
```bash
# Backup configuration
cp .env /backup/env-backup
```

## Cost Analysis

### Initial Setup Costs
- **Hardware**: $2,000-$10,000 (depending on requirements)
- **Software**: Free (open source solutions)
- **Setup Time**: 1-3 days

### Ongoing Costs
- **Electricity**: $50-200/month (depending on usage)
- **Maintenance**: 2-4 hours/month
- **Updates**: 1-2 hours/month

### Break-even Analysis
- **OpenAI Cost**: ~$0.002 per request
- **Local Cost**: ~$0.0001 per request (after setup)
- **Break-even**: ~10,000 requests

## Next Steps

After successful local LLM setup:

1. **Performance Tuning**: Optimize for your specific use case
2. **Model Fine-tuning**: Train on your ticket data
3. **Integration Testing**: Comprehensive testing with real data
4. **User Training**: Train users on new capabilities
5. **Monitoring Setup**: Implement comprehensive monitoring
6. **Backup Strategy**: Establish backup and recovery procedures

## Support Resources

- **Ollama Documentation**: https://ollama.ai/docs
- **LM Studio Support**: https://lmstudio.ai/docs
- **Hugging Face Models**: https://huggingface.co/models
- **Community Forums**: Reddit r/LocalLLaMA
- **GitHub Issues**: Project-specific issue tracker
