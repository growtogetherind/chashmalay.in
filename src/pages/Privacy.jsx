import React from 'react';

const Privacy = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 bg-white p-8 md:p-12 shadow-sm rounded-2xl">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 text-center">Privacy Policy & Disclaimer</h1>
        
        <div className="space-y-8 text-gray-600 text-sm md:text-base leading-relaxed">
          
          {/* Privacy Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Information About Our Organisation and Website</h3>
                <p className="mb-2">
                  Chashmalay.in respects your privacy and is committed to protecting it. We provide this Privacy Statement to inform you of our Privacy Policy and practices and of the choices you can make about the way your information is collected online and how that information is used. This website is governed in accordance with the laws of India. The Indian courts shall have exclusive jurisdiction over any dispute arising out of your use of this website.
                </p>
                <p>
                  The www.chashmalay.in website is owned by Chashmalay, Shop no 7, Trimurti Plaza, Somatne Phata, Somatane, Maharashtra 410506.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Data Automatically Collected</h3>
                <p>
                  We log visitor's domain and IP address automatically; this information does not identify you as an individual, but only the computer that is being used to view the site. This data is used to see where the site is being used in the world to ensure coverage, and for click stream analysis to help better understand site usage, so that we can improve our service to you. We do not link information automatically logged by such means with personal data about specific individuals.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Data Collection and Use</h3>
                <p className="mb-2">
                  When you request information through this site, we may need to know some personal information about you. When emailing us, or subscribing for free news or information we need your e-mail address, name and other limited personal identifiers, typically name and contact number. If you choose to purchase information, goods, products or services, we will usually require some additional limited financial details.
                </p>
                <p className="mb-2">
                  If we require sensitive personal data then we will ensure that the collection and use is in strict accordance with the "Information Technology Act" principles of data protection and data privacy.
                </p>
                <p>
                  We will not pass your details to anyone else outside Chashmalay.in without your permission.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Disclosure and Visitor Choice</h3>
                <p>
                  You may unsubscribe or opt-out of services at any time, details of how to opt-out is a simple process. Where we disclose your personal data for those purposes stated, we provide you with the means to opt-out of disclosure by either indicating in a box at the point of the site where personal data is collected, by sending an email or by sending postal mail to our address.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Data Retention & Security</h3>
                <p className="mb-2">
                  All the data captured by us is retained by us.
                </p>
                <p>
                  We have implemented security policies, rules and technical measures to protect the personal data that we have under our control that complies fully with data privacy & protection legislation appropriate to the jurisdiction applicable to the site. The security measures are designed to prevent unauthorized access, improper use or disclosure, unauthorized modification & unlawful destruction or accidental loss.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Hyperlinks</h3>
                <p>
                  The www.chashmalay.in website may provide links to third-party websites for your convenience and information. If you access those links, you will leave the www.chashmalay.in website. We do not control those sites or their privacy practices. We encourage you to review the privacy policy of any company before submitting your personal information.
                </p>
              </div>
            </div>
          </section>

          <hr className="my-10 border-gray-200" />

          {/* Disclaimer */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Disclaimer</h2>
            
            <div className="space-y-4">
              <p>
                All necessary steps are made to make sure that all the information provided on www.chashmalay.in is correct and accurate. However, Chashmalay.in does not make any warrants nor any representation that the information provided on the site is complete, accurate or correct. In no event shall we be held responsible for any direct, indirect or by any means damaged caused or any other damage resulting in:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The use or inability to use the services</li>
                <li>Unauthorized access to or alteration to the user's transmission or data or any other matter relating to services; including without limitation damages for loss of use, data or profits, arising out of use of the website or services.</li>
              </ul>
              <p>
                Chashmalay.in shall not be responsible for delay or inability to use the Website or related services, failure to provide services, or any other information or services obtained through the website. We are not held responsible for non-availability of the website or any of its services or products during periodic maintenance operations or any unplanned suspension of access to the Website that may occur due to any technical error which is beyond Chashmalay.in's control.
              </p>
              <p>
                The user understands and agrees that any materials downloaded or obtained through the website is entirely at their own risk. The company will not be held responsible for any damage caused to their computer system while downloading or after downloading our materials in any manner whatsoever and as such the user is solely held responsible for any such damages.
              </p>
            </div>
          </section>
          
        </div>
      </div>
    </div>
  );
};

export default Privacy;
