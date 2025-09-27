import React, { useContext, useEffect, useState } from "react";
import { motion } from "motion/react";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";

const Dashboard = () => {
  const { user, token, backendUrl } = useContext(AppContext);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserImages = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/image/user-images`, {
        headers: { token },
      });
      if (data.success) {
        setImages(data.images);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchUserImages();
    }
  }, [user, token]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your images...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0.2, y: 100 }}
      transition={{ duration: 1 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="min-h-[80vh] pt-14 mb-10"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-neutral-800 mb-2">
          Your Image Gallery
        </h1>
        <p className="text-gray-600">
          All your generated images in one place
        </p>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <img 
              src={assets.star_group} 
              alt="No images" 
              className="w-16 h-16 opacity-50"
            />
          </div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">
            No images generated yet
          </h3>
          <p className="text-gray-500 mb-6">
            Start creating amazing images with AI!
          </p>
          <button
            onClick={() => window.location.href = '/result'}
            className="bg-gray-800 text-white px-6 py-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            Generate Your First Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {images.map((image, index) => (
            <motion.div
              key={image._id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={image.imageUrl}
                  alt={image.prompt}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {image.prompt}
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  {formatDate(image.createdAt)}
                </p>
                <div className="flex gap-2">
                  <a
                    href={image.imageUrl}
                    download
                    className="flex-1 bg-gray-800 text-white text-xs py-2 px-3 rounded text-center hover:bg-gray-700 transition-colors"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(image.imageUrl);
                      toast.success("Image URL copied to clipboard!");
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 text-xs py-2 px-3 rounded text-center hover:bg-gray-300 transition-colors"
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={async () => {
                      const isDataUrl = typeof image.imageUrl === 'string' && image.imageUrl.startsWith('data:');
                      try {
                        if (isDataUrl) {
                          const res = await fetch(image.imageUrl);
                          const blob = await res.blob();
                          const fileName = `imagify-${(image.prompt || 'image').slice(0, 16).replace(/[^a-z0-9-_]+/gi, '-')}.png`;
                          const file = new File([blob], fileName, { type: blob.type || 'image/png' });

                          if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            await navigator.share({ files: [file], title: 'Imagify Image', text: image.prompt });
                            return;
                          }
                          await navigator.clipboard.writeText(image.imageUrl);
                          toast.info('Sharing not supported here. Image URL copied!');
                          return;
                        }

                        if (navigator.share) {
                          await navigator.share({ title: 'Imagify Image', text: image.prompt, url: image.imageUrl });
                        } else {
                          await navigator.clipboard.writeText(image.imageUrl);
                          toast.info('Share not supported. URL copied!');
                        }
                      } catch (err) {
                        try {
                          await navigator.clipboard.writeText(image.imageUrl);
                          toast.info('Could not open share sheet. URL copied!');
                        } catch (_) {
                          toast.error('Unable to share or copy.');
                        }
                      }
                    }}
                    className="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded text-center hover:bg-blue-500 transition-colors"
                  >
                    Share
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Dashboard;
