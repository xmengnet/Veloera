#!/bin/bash

# Find all adaptor.go files in the relay/channel directory and its subdirectories
find relay/channel -name "adaptor.go" -not -path "*/openai/*" | while read -r file; do
    # Check if the file already has the ConvertOpenAIResponsesRequest method
    if ! grep -q "ConvertOpenAIResponsesRequest" "$file"; then
        # Add the method before the DoRequest method
        sed -i '/func (a \*Adaptor) DoRequest/i \
func (a *Adaptor) ConvertOpenAIResponsesRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.OpenAIResponsesRequest) (any, error) {\
\t// TODO implement me\
\treturn nil, errors.New("not implemented")\
}\
' "$file"
        echo "Added method to $file"
    else
        echo "Method already exists in $file"
    fi
done
