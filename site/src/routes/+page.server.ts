/* /**
 * 1. Relative path: site/src/routes/+page.server.ts
 * 2. Description: Server-side form actions for the marketing site.
 * 3. Expects: SvelteKit Actions API, strict FormData parsing.
 * 4. Provides: Secure JSON proxy to self-hosted Notifuse public subscribe endpoint, bypassing CORS.
 *//* 
import { fail, type Actions } from '@sveltejs/kit';

const NOTIFUSE_API = 'https://newsletter.homahuki.eu/subscribe';
const WORKSPACE_ID = 'homahuki'; 
const LIST_ID = 'swisd'; 

export const actions: Actions = {
  subscribe: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email');
    const firstName = data.get('first_name');
    const lastName = data.get('last_name');

    const emailStr = typeof email === 'string' ? email : '';
    const firstNameStr = typeof firstName === 'string' ? firstName.trim() : '';
    const lastNameStr = typeof lastName === 'string' ? lastName.trim() : '';

    if (!emailStr || !emailStr.includes('@')) {
      return fail(400, { 
        error: 'A valid email is required.', 
        email: emailStr, 
        first_name: firstNameStr, 
        last_name: lastNameStr 
      });
    }

    // Strictly typed contact object — omit empty optional fields
    const contact: { email: string; first_name?: string; last_name?: string } = { 
      email: emailStr 
    };
    if (firstNameStr) contact.first_name = firstNameStr;
    if (lastNameStr) contact.last_name = lastNameStr;

    try {
      const response = await fetch(NOTIFUSE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: WORKSPACE_ID,
          contact,
          list_ids: [LIST_ID]
        })
      });

      if (!response.ok) {
        let errorMessage = 'Subscription failed. Please try again.';
        try {
          const errorBody = await response.json() as { error?: string };
          if (errorBody.error) errorMessage = errorBody.error;
        } catch {
          // Ignore JSON parse errors on non-JSON error responses
        }
        return fail(response.status, { 
          error: errorMessage, 
          email: emailStr, 
          first_name: firstNameStr, 
          last_name: lastNameStr 
        });
      }

      return { success: true };
    } catch (err: unknown) {
      // Narrowing the unknown error strictly — no `any` allowed in this house.
      const message = err instanceof Error ? err.message : 'Unknown network error';
      return fail(500, { 
        error: `Network error: ${message}`, 
        email: emailStr, 
        first_name: firstNameStr, 
        last_name: lastNameStr 
      });
    }
  }
}; */