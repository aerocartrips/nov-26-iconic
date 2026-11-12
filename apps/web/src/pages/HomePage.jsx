import React from 'react';
import { Helmet } from 'react-helmet';
import Hero from '@/components/Hero';
import Collections from '@/components/Collections';
import Reviews from '@/components/Reviews';
import QuoteForm from '@/components/QuoteForm';

const HomePage = () => {
  return (
    <>
      <Helmet>
        <title>Iconic Handicraft — Premium Luxury Gifting & Custom Packaging</title>
        <meta
          name="description"
          content="Iconic Handicraft manufactures premium gifting solutions — corporate hampers, MDF gift boxes, eco-friendly bags and fully customized luxury packaging. MOQ from 100 pieces."
        />
      </Helmet>
      <Hero />
      <Collections />
      <Reviews />
      <QuoteForm />
    </>
  );
};

export default HomePage;
