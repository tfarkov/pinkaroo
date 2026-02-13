import { GetServerSideProps } from 'next';

/** Find a Home is now on the homepage. Redirect /listings to /. */
export default function ListingsIndexRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return { redirect: { destination: '/', permanent: false } };
};
