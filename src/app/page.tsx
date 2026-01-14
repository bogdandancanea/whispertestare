
import WhisperApp from '@/components/whisper-app';
import { getCardState, CardState } from '@/lib/actions';
import { redirect } from 'next/navigation';

// This is a server component that will handle the logic for all cards.
export default async function HomePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const cardId = typeof searchParams.card === 'string' ? searchParams.card : 'INVALID';

  // The card state is fetched on the server.
  // getCardState will now handle the strict validation.
  const initialState = await getCardState(cardId);
  
  // If the card is not valid (not in whitelist, not in DB, or inactive), redirect.
  if (!initialState.valid) {
    redirect('/invalid');
  }

  // We pass the cardId and the initial state to the client component.
  return <WhisperApp cardId={cardId} initialState={initialState} />;
}
