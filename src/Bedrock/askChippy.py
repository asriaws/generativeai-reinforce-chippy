import json
import boto3
import botocore

client = boto3.client('bedrock-runtime')

def lambda_handler(event, context):
    
    prompt = """Human: Provide a short explanation within 100 words to a toddler with an example involving a puppy name Chippy for the following question.
    """ + str(event['question']) + """
    Assistant:
    """
    modelId = "anthropic.claude-3-haiku-20240307-v1:0"  # change this to use a different version from the model provider
    accept = "application/json"
    contentType = "application/json"
    response = client.invoke_model(
                modelId=modelId,
                body=json.dumps(
                    {
                        "anthropic_version": "bedrock-2023-05-31",
                        "max_tokens": 150,
                        "messages": [
                            {
                                "role": "user",
                                "content": [{"type": "text", "text": prompt}],
                            }
                        ],
                    }
                ),
            )
    result = json.loads(response.get("body").read())
    output_list = result.get("content", [])
    
    print(output_list[0]['text'])
    
    #split response_body when there is a *
    return {
        'statusCode': 200,
        'body': json.dumps(output_list[0]['text'])
    }
