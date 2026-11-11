import { Form, NavLink, useRouteLoaderData } from 'react-router-dom';

const MainNavigation = () => {
  const token = useRouteLoaderData('root');

  return (
    <header>
      <nav>
        {token &&
          <NavLink to="/protected">Protected Route</NavLink>
        }
        {!token &&
          <NavLink to="/authentication?mode=login">Authentication</NavLink>
        }
        {token &&
          <Form action="/logout" method="post">
            <button type="submit">Log Out</button>
          </Form>
        }
      </nav>
    </header>
  );
};

export default MainNavigation;