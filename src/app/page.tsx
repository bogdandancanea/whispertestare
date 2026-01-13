
import WhisperApp from '@/components/whisper-app';
import { getCardState, CardState } from '@/lib/actions';

// This is a server component that will handle the logic for all cards.
export default async function HomePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // We get the cardId from the `card` query parameter, defaulting to 'DEFAULT'
  const cardId = typeof searchParams.card === 'string' ? searchParams.card : 'DEFAULT';
  
  // The card state is fetched on the server.
  // getCardState will handle valid, non-existent (exhausted), and default cards.
  const initialState = await getCardState(cardId);

  // We pass the cardId and the initial state to the client component.
  return <WhisperApp cardId={cardId} initialState={initialState} />;
}
