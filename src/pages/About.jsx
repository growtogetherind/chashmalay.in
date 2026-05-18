import React from 'react';
import { ShieldCheck, Eye, Users, Target } from 'lucide-react';


const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero bg-gray-50 py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">About Chashmalay</h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Welcome to a world of perfect vision. Where clarity meets style, and perfection is a way of life.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="about-content py-16">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="text-gray-600 space-y-4 leading-relaxed">
              <p>
                It was in the year 2020 when we laid the strong foundation of Chashmalay.in. Our honest ardor gave our brand its first store — our main branch located at <strong>Shop no 7, Trimurti Plaza, Somatne Phata, Somatane, Maharashtra 410506</strong>.
              </p>
              <p>
                Resting on the four pillars of perseverance, loyalty, grit, and relentlessness, the brand strived to foray forward. We have continued to evolve remarkably ever since. The optical industry in India had a gaping slot for a retail chain that could provide end-to-end solutions for vision challenges, alongside a pressing market for quality and affordable eyewear.
              </p>
              <p>
                Chashmalay.in not only fulfills the need of the market but also elevates it to provide the most fashionable eyewear.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-6 rounded-2xl text-center">
              <Eye className="mx-auto text-primary mb-3" size={32} />
              <h3 className="font-bold text-gray-900">Perfect Vision</h3>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl text-center">
              <ShieldCheck className="mx-auto text-primary mb-3" size={32} />
              <h3 className="font-bold text-gray-900">Top Quality</h3>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl text-center">
              <Users className="mx-auto text-primary mb-3" size={32} />
              <h3 className="font-bold text-gray-900">Expert Team</h3>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl text-center">
              <Target className="mx-auto text-primary mb-3" size={32} />
              <h3 className="font-bold text-gray-900">Clear Mission</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Target className="text-blue-400" /> Our Mission
            </h2>
            <p className="text-gray-300 leading-relaxed">
              We are into the business of “Optical Retailing” where customers are our assets and employees are our strengths. To attain a leadership position, we need to preserve our assets and keep enhancing our strengths by constantly providing them a platform to enrich their experiences and enhance their leadership capabilities. We do not compromise on our core ethics and therefore we are able to give excellent value to our customers, employees, and all stakeholders.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Eye className="text-blue-400" /> Our Vision
            </h2>
            <p className="text-gray-300 leading-relaxed">
              We aspire to achieve a leadership position in providing ‘Perfect Vision’ to all eyes by building a trusted optical retail network, delivering world-class service and unforgettable eye care experiences to our patrons.
            </p>
          </div>
        </div>
      </section>

      {/* Director's Desk */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">From The Director's Desk</h2>
          <blockquote className="text-xl italic text-gray-600 mb-8">
            "Almost nothing needs to be said when you have eyes!"
          </blockquote>
          <div className="text-gray-600 space-y-4 leading-relaxed text-left max-w-3xl mx-auto">
            <p>
              This phrase caught on with me very early in my life. We run the Chashmalay.in chain of eyewear with the blessings of the almighty, our kin, and our extended family of trusted employees.
            </p>
            <p>
              Chashmalay, the name itself speaks volumes. Towering against all adversities, we stand proud serving others with dedication and profound consistency. We continue to evolve with changing trends, inculcating them all as we proceed.
            </p>
            <p>
              Based on solid foundations and with unending support from countless people who have placed their trust in us, we provide qualitative and trendiest eyewear to people. As times change, we are now poised to take our endeavour to a different level altogether.
            </p>
            <p>
              It has indeed been a beautiful journey since 2020 when we opened our main branch in Somatane Phata. Chashmalay is moving from strength to strength in more ways than one. I take this opportunity to humbly thank every person who has been a part of us. Our company is now synonymous with integrity, and I pledge to uphold the same passion as we continue to evolve further.
            </p>
            <p className="mt-6 font-semibold text-center text-gray-800">
              Feel free to get in touch with us at <a href="mailto:info@chashmalay.in" className="text-primary hover:underline">info@chashmalay.in</a> and we promise to deliver.
            </p>
          </div>
        </div>
      </section>

      {/* Team & Products */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Team of Chashmalay</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We take immense pride in introducing to you our inimitable task force that has been our strength. We have a team of qualified optometrists that are best at their jobs, dynamic executives that insist to serve, and skilled technicians that leave no stone unturned to bring you unforgettable vision-care solutions and technologically advanced eyewear. Service and dedication fuels us, and the rest, as they say, follows.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Products & Quality</h2>
            <p className="text-gray-600 leading-relaxed">
              We offer best-in-class products, whether it be stylish sunglasses to protect your eyes and look cool, or prescription glasses & spectacles to give you better vision without looking out of trend. Our spectacle frames are trendy and make you shine out of the rest. We also provide top-quality contact lenses for those who prefer to go frameless. With world-renowned brands and our own curated selections, we ensure you have tailored solutions that best suit your personality.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;
