import { getAuthToken } from '../utils/auth-utils.js';
import { useFetcher, useLoaderData } from 'react-router-dom';
// useFetcher: fetch form data without rerouting

const FIREBASE_DB_URL = 'https://title-auth-db-fb4b0-default-rtdb.firebaseio.com/';

const ProtectedPage = () => {
  const items = useLoaderData();
  const fetcher = useFetcher();

  return (
    <>
      <h2>Protected Page</h2>
      <p>Only authenticated users can access this page.</p>

      <fetcher.Form method="post">
        <div className="form-control">
          <label>List Title</label>
          <input id="title" type="text" name="title" required></input>
        </div>
      </fetcher.Form>

      {fetcher.data?.message && (
        <div className="alert-success">
          Server Response: {fetcher.data.message}
        </div>
      )}

      <h3>List of Titles</h3>
      {items && items.length > 0 ? (
        <ul>
          {items.map(item => (
            <li key={item.id}>{item.title}</li>
          ))}
        </ul>
      ) : (<p>No Items Found</p>)
      }
    </>
  );
};

export default ProtectedPage;

export async function loader() {
  const token = getAuthToken();
  const response = await fetch(`${FIREBASE_DB_URL}/items.json?auth=${token}`);

  if (!response.ok) {
    throw new Response(JSON.stringify({ message: 'could not fetch items.' }), { status: 500 });
  }
  const responseData = await response.json();
  const loadedItems = [];

  for (const key in responseData) {
    loadedItems.push({
      id: key,
      title: responseData[key].title
    });
  }

  return loadedItems;
}

export async function action({ request }) {
  const token = getAuthToken();
  const data = await request.formData(); // title
  const itemData = {
    title: data.get('title')
  };

  const response = await fetch(`${FIREBASE_DB_URL}/items.json?auth=${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // Authorization: 'Bearer ' + token // for local, firebase token goes in url
    },
    body: JSON.stringify(itemData)
  });

  if (!response.ok) {
    return { message: 'Failed to save item.' };
  }

  // return response.json();
  return { message: 'Item saved successfully.' };
}