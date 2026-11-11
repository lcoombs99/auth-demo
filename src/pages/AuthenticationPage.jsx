import { Form, Link, redirect, useActionData, useSearchParams, useNavigation } from 'react-router-dom';
import { useState } from 'react';

const AuthenticationPage = () => {
  const data = useActionData();
  const isSubmitting = navigation.state === 'submitting';
  const [searchParams] = useSearchParams();
  const isLogin = searchParams.get('mode') !== 'signup';
  // from url: ?mode=signup
  const [password, setPassword] = useState('');

  return (
    <>
      <h1>{isLogin ? 'Log In' : 'Create New User'}</h1>

      {data?.errors && (
        <ul>
          {Object.values(data.errors).map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}
      {data?.message && <p className="alert-error">{data.message}</p>}

      <Form method="POST">
        <div className="form-control">
          <label htmlFor="email">Email Address</label>
          <input id="email" type="email" name="email" required/>
        </div>
        <div className="form-control">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" name="password" required onChange={(e) => setPassword(e.target.value)} />
          {!isLogin && <p>Password must be at least 6 characters. Current length: {password.length}</p>}
        </div>
        <div className="form-action">
          <button
            type="submit"
            disabled={isSubmitting || password.length < 6}
          >
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
          <Link to={`?mode=${isLogin ? 'signup' : 'login'}`}>
            {isSubmitting ? 'Submitting...' :
              isLogin ? 'Need an Account? Sign Up.' : 'Already have an account? Log In.'}
          </Link>
        </div>
      </Form>
    </>
  );
};

export default AuthenticationPage;

export async function action({ request }) {
  const searchParams = new URL(request.url).searchParams;
  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  // comes in because we are using react router's form
  const data = await request.formData();
  // retrieve the data from form
  const authData = {
    email: data.get('email'),
    password: data.get('password')
  };

  // send that data to the backend
  const response = await fetch(`http://localhost:8080/${mode}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(authData)
  });

  if (response.status === 401 || response.status === 422) {
    return response;
  }

  if (!response.ok) {
    throw new Response(
      JSON.stringify({ message: 'Could not authenticate user.' }),
      { status: 500 }
    );
  }

  const responseData = await response.json();
  const token = responseData.token;
  localStorage.setItem('token', token);

  const expiration = new Date();
  // expiration.setSeconds(expiration.getSeconds() + 15);
  expiration.setHours(expiration.getHours() + 1);

  localStorage.setItem('expiration', expiration.toISOString());

  return redirect('/');
}