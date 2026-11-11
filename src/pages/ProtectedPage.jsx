import { getAuthToken } from '../utils/auth-utils.js';
import { useFetcher } from 'react-router-dom';
// useFetcher: fetch form data without rerouting

const ProtectedPage = () => {
  const fetcher = useFetcher();

  return (
    <>
      <h2>Protected Page</h2>
      <p>Only authenticated users can access this page.</p>

      <fetcher.Form method="post">
        <button type="submit">Perform Action</button>
      </fetcher.Form>

      {fetcher.data?.message && (
        <div className="alert-success">
          Server Response: {fetcher.data.message}
        </div>
      )}
    </>
  );
};

export default ProtectedPage;


export async function action() {
  const token = getAuthToken();
  // standard format

  const response = await fetch('http://localhost:8080/secret-action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  });

  if (!response.ok) {
    return { message: 'Failed to validate token.' };
  }

  return response.json();
}