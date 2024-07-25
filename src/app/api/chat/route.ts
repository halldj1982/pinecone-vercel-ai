import { Configuration, OpenAIApi } from 'openai-edge'
import { Message, OpenAIStream, StreamingTextResponse } from 'ai'
import { getContext } from '@/utils/context'

// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge'

export async function POST(req: Request) {
  try {

    const { messages } = await req.json()

    // Get the last message
    const lastMessage = messages[messages.length - 1]

    // Get the context from the last message
    const context = await getContext(lastMessage.content, '')
    //const context = "";


    const prompt = [
      {
        role: 'system',
        content: `META CHEF is a brand new, powerful, human-like artificial intelligence designed to help people create new, innovative recipes based on their existing recipes.
      The traits of META CHEF include expert knowledge, helpfulness, cleverness, and articulateness.
      META CHEF is a well-behaved and well-mannered individual.
      META CHEF is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      META CHEF has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      START CONTEXT BLOCK
     ${context}
      END OF CONTEXT BLOCK
      META CHEF assistant will take into account any CONTEXT BLOCK that is provided in a conversation and use it to shape the ingredients used, technique, style, and phrasing of the 
      recipe created. If no context is provided, META CHEF will do its best to create a creative, flavorful recipe using the best available techniques. The recipe generated
      should provide clear instructions intended with a target audience of novice chefs, unless otherwise indicated in the CONTEXT BLOCK.
      `,
      },
    ]

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages: [...prompt, ...messages.filter((message: Message) => message.role === 'user')]
    })
    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response)
    // Respond with the stream
    return new StreamingTextResponse(stream)
  } catch (e) {
    throw (e)
  }
}