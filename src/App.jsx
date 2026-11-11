import { createBrowserRouter, Outlet, RouterProvider, useLoaderData, useSubmit } from 'react-router-dom';
import MainNavigation from './components/MainNavigation.jsx';
import HomePage from './pages/HomePage.jsx';
import AuthenticationPage, { action as authenticationAction } from './pages/AuthenticationPage.jsx';
import ProtectedPage, { action as protectedAction, loader as protectedLoader } from './pages/ProtectedPage.jsx';
import { action as logoutAction } from './pages/Logout.jsx';
import { checkAuthLoader, getTokenDuration, tokenLoader } from './utils/auth-utils.js';
import { useEffect } from 'react';

const RootLayout = () => {
  const token = useLoaderData();
  const submit = useSubmit();

  useEffect(() => {
    if (!token)
      return;

    if (token === 'EXPIRED') {
      submit(null, { action: '/logout', method: 'post' });
    }

    const tokenDuration = getTokenDuration();

    const timer = setTimeout(() => {
      submit(null, { action: '/logout', method: 'post' });
    }, tokenDuration);

    return () => clearTimeout(timer)
  }, [token, submit]);

  return (
    <>
      <MainNavigation/>
      <main>
        <Outlet/>
      </main>
    </>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout/>,
    id: 'root',
    loader: tokenLoader,
    children: [
      { index: true, element: <HomePage/> },
      {
        path: 'authentication',
        element: <AuthenticationPage/>,
        action: authenticationAction
      },
      {
        path: 'protected',
        element: <ProtectedPage/>,
        // loader: checkAuthLoader, // check if token exists and rediret if no
        loader: async () => { // loader can do multiple things if written as an async function
          const redirectResult = checkAuthLoader();
          if (redirectResult) return redirectResult;
          return protectedLoader();
        },
        action: protectedAction
      },
      {
        path: 'logout',
        action: logoutAction
      }
    ]
  }
]);

function App() {

  return (
    <>
      <RouterProvider router={router}/>
    </>
  );
}

export default App;
