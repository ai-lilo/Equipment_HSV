import Anthropic from 'npm:@anthropic-ai/sdk@0.27.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { notes } = await req.json()

    if (!notes?.trim()) {
      return new Response(JSON.stringify({ error: 'Keine Notizen übergeben' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const client = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: 'Du bist Organisationsassistent eines Hundesportvereins. Leite aus diesen Turniernotizen konkrete Best Practices für zukünftige Turniere ab. Antworte auf Deutsch in einer nummerierten Liste.',
      messages: [{ role: 'user', content: notes }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
