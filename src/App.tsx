import React, { useEffect, useState } from "react";
import "./App.css";

const product = {
  title: "Sample Product",
  description: "This is a description of the sample product.",
  imageUrl:
      "https://images.teamshirts.net/image/upload/c_crop,w_3560,h_2670,x_230,y_0/q_auto,fl_lossy,f_auto,w_720/New%20Landingpages/UK/teaser/custom-men-shirt",
};

function getCookie(name: string): string | null {
  const value = "; " + document.cookie;
  const parts = value.split("; " + name + "=");
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_ENDPOINT}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await response.json();

      if (data.access_token) {
        document.cookie = `access_token_3rd_party=${data.access_token}`;
        onSuccess();
      } else {
        alert("Login failed!");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
      <div className="LoginModal">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Email:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label>Password:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit">Login</button>
          <button type="button" onClick={onClose}>Close</button>
        </form>
      </div>
  );
}

function App() {
  const encodedOrigin = encodeURIComponent(window.location.href)
  const [productId, setProductId] = useState<string | null>(null);
  const [fittingRoomProducts, setFittingRoomProducts] = useState<string[]>([]);
  const [showViewInFittingRoomButton, setShowViewInFittingRoomButton] = useState(true);
  const [showAddToFittingRoomButton, setShowAddToFittingRoomButton] = useState(true);
  const [showViewToFittingRoomButtonOpenInANewTab, setShowViewToFittingRoomButtonOpenInANewTab] = useState(false);
  const [showAddToFittingRoomButtonOpenInANewTab, setShowAddToFittingRoomButtonOpenInANewTab] = useState(false);
  const [showFittingRoomButtons, setShowFittingRoomButtons] = useState(true);
  const [checkCredits, setCheckCredits] = useState(false);
  const [enableAddOrigin, setAddEnableOrigin] = useState(false);
  const [enableViewOrigin, setEnableViewOrigin] = useState(false);
  const [creditsAvailable, setCreditsAvailable] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const userToken = getCookie("access_token_3rd_party");

  const handleFittingRoomButtonsChange = () => {
    setShowFittingRoomButtons(!showFittingRoomButtons);
    setShowViewInFittingRoomButton(!showViewInFittingRoomButton);
    setShowAddToFittingRoomButton(!showAddToFittingRoomButton);
  };

  const handleViewFittingRoomButtonChange = () => {
    setShowViewInFittingRoomButton(!showViewInFittingRoomButton);
    if (!showViewInFittingRoomButton && !showAddToFittingRoomButton) {
      setShowFittingRoomButtons(false);
    } else if (showViewInFittingRoomButton && showAddToFittingRoomButton) {
      setShowFittingRoomButtons(true);
    }
  };

  const handleAddFittingRoomButtonChange = () => {
    setShowAddToFittingRoomButton(!showAddToFittingRoomButton);
    if (!showViewInFittingRoomButton && !showAddToFittingRoomButton) {
      setShowFittingRoomButtons(false);
    } else if (showViewInFittingRoomButton && showAddToFittingRoomButton) {
      setShowFittingRoomButtons(true);
    }
  };

  const checkCreditsAvailability = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_ENDPOINT}/credits_check?domain=zumo-international.com`);
      const data = await response.json();
      setCreditsAvailable(data?.credits_check ?? false);
    } catch (error) {
      console.error("Error checking credits:", error);
    }
  }

  useEffect(() => {
    if (checkCredits) {
      checkCreditsAvailability();
    }
  }, [checkCredits]);

  const handleViewInFittingRoom = async () => {
    try {
      const endpoint = `${process.env.REACT_APP_API_BASE_ENDPOINT}/retrieve-url-button?ean=210000013798&button_type_id=1`;
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data && data?.url) {
        const params = new URLSearchParams(new URL(data.url).search);
        const extractedProductId = params.get("product_id");

        if (extractedProductId) {
          setProductId(extractedProductId);
        }

        let targetURL = data?.url
        if (enableViewOrigin) {
          targetURL = `${targetURL}&origin=${encodedOrigin}`
        }

        window.open(targetURL, showViewToFittingRoomButtonOpenInANewTab ? '_blank' : '_self')
      }
    } catch (error) {
      console.error("Error fetching the URL:", error);
    }
  };

  const fetchFittingRoomCart = async () => {
    try {
      const response = await fetch(
          `${process.env.REACT_APP_API_BASE_ENDPOINT}/fitting_room_cart`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${userToken}`,
              "Content-Type": "application/json",
            },
          }
      );
      const data = await response.json();

      if (data && data?.products) {
        setFittingRoomProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching the products:", error);
    }
  };

  const addToFittingRoom = async () => {
    if (!userToken) {
      setShowLoginModal(true);
      return;
      // window.open(`${process.env.REACT_APP_SITE_BASE_URL}/login?origin=${encodedOrigin}`, showAddToFittingRoomButtonOpenInANewTab ? '_blank' : '_self')
    } else {
      if (!productId) {
        window.alert('Not found any product id, please click on View in Fitting Room to add!')
      } else {
        try {
          let targetURL = `${process.env.REACT_APP_API_BASE_ENDPOINT}/add-to-cart`
          if (enableAddOrigin) {
            targetURL = `${targetURL}?origin=${encodedOrigin}`
          }
          const response = await fetch(
              targetURL,
              {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${userToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  products: [productId],
                }),
              }
          );

          if (response.status === 401) {
            setShowLoginModal(true);
            return
          }

          if (response.ok && response.status === 200) {
            await fetchFittingRoomCart();
          }
        } catch (error) {
          console.error("Error adding to fitting room:", error);
        }
      }
    }
  };

  const removeFromFittingRoom = async () => {
    try {
      const response = await fetch(
          `${process.env.REACT_APP_API_BASE_ENDPOINT}/remove-from-cart`,
          {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${userToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              products: [productId],
            }),
          }
      );

      if (response.status === 401) {
        setShowLoginModal(true);
        return
      }

      if (response.ok) {
        await fetchFittingRoomCart();
      }
    } catch (error) {
      console.error("Error removing from fitting room:", error);
    }
  };

  useEffect(() => {
    if (userToken) fetchFittingRoomCart();
  }, [userToken]);

  const renderCTAs = () => {
    if ((showFittingRoomButtons && !checkCredits) || showFittingRoomButtons && checkCredits && creditsAvailable) {
      return (
          <>
            <button className="Button" onClick={handleViewInFittingRoom}>View in Fitting Room</button>
            {(fittingRoomProducts.includes(productId!)
                    ? <button className="Button" onClick={removeFromFittingRoom}>Remove from Fitting Room</button>
                    : <button className="Button" onClick={addToFittingRoom}>Add to Fitting Room</button>
            )}
          </>
      )
    }

    if (!showFittingRoomButtons) {
      return (
          <>
            {showViewInFittingRoomButton && <button className="Button" onClick={handleViewInFittingRoom}>View in Fitting Room</button>}
            {showAddToFittingRoomButton && (fittingRoomProducts.includes(productId!)
                    ? <button className="Button" onClick={removeFromFittingRoom}>Remove from Fitting Room</button>
                    : <button className="Button" onClick={addToFittingRoom}>Add to Fitting Room</button>
            )}
          </>
      )
    }

    return null
  }

  useEffect(() => {
    if (!showAddToFittingRoomButton || !showViewInFittingRoomButton) setShowFittingRoomButtons(false)
    else setShowFittingRoomButtons(true)
  }, [showAddToFittingRoomButton, showViewInFittingRoomButton])

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
  };


  return (
      <div className="App">
        <div className="Product">
          <img
              src={product.imageUrl}
              alt={product.title}
              className="Product-image"
          />
          <h1 className="Product-title">{product.title}</h1>
          <p className="Product-description">{product.description}</p>

          <hr />

          <div>
            <div>
              <div>
                <label>
                  <div className="switch">
                    <input
                        type="checkbox"
                        checked={showFittingRoomButtons}
                        onChange={handleFittingRoomButtonsChange}
                    />
                    <span className="slider"></span>
                  </div>
                  Show Fitting Room buttons
                </label>
              </div>

              <div style={{ marginLeft: "20px" }}>
                <div>
                  <div>
                    <label>
                      <div className="switch">
                        <input
                            type="checkbox"
                            checked={showViewInFittingRoomButton}
                            onChange={handleViewFittingRoomButtonChange}
                        />
                        <span className="slider"></span>
                      </div>
                      View Fitting Room button
                    </label>
                  </div>
                  <div style={{ marginLeft: "20px" }}>
                    <label>
                      <div className="switch">
                        <input
                            type="checkbox"
                            checked={showViewToFittingRoomButtonOpenInANewTab}
                            onChange={() => setShowViewToFittingRoomButtonOpenInANewTab(!showViewToFittingRoomButtonOpenInANewTab)}
                        />
                        <span className="slider"></span>
                      </div>
                      Open in a new tab
                    </label>
                  </div>
                  <div style={{ marginLeft: "20px" }}>
                    <label>
                      <div className="switch">
                        <input
                            type="checkbox"
                            checked={enableViewOrigin}
                            onChange={() => setEnableViewOrigin(!enableViewOrigin)}
                        />
                        <span className="slider"></span>
                      </div>
                      Enable Origin
                    </label>
                  </div>
                </div>
                <div>
                  <div>
                    <label>
                      <div className="switch">
                        <input
                            type="checkbox"
                            checked={showAddToFittingRoomButton}
                            onChange={handleAddFittingRoomButtonChange}
                        />
                        <span className="slider"></span>
                      </div>
                      Add to Fitting Room button
                    </label>
                  </div>
                  <div style={{ marginLeft: "20px" }}>
                    <label>
                      <div className="switch">
                        <input
                            type="checkbox"
                            checked={showAddToFittingRoomButtonOpenInANewTab}
                            onChange={() => setShowAddToFittingRoomButtonOpenInANewTab(!showAddToFittingRoomButtonOpenInANewTab)}
                        />
                        <span className="slider"></span>
                      </div>
                      Open in a new tab
                    </label>
                  </div>
                  <div style={{ marginLeft: "20px" }}>
                    <label>
                      <div className="switch">
                        <input
                            type="checkbox"
                            checked={enableAddOrigin}
                            onChange={() => setAddEnableOrigin(!enableAddOrigin)}
                        />
                        <span className="slider"></span>
                      </div>
                      Enable Origin
                    </label>
                  </div>
                </div>
                <div>
                  <label>
                    <div className="switch">
                      <input
                          type="checkbox"
                          checked={checkCredits}
                          onChange={() => setCheckCredits(!checkCredits)}
                      />
                      <span className="slider"></span>
                    </div>
                    Check Credits
                  </label>
                </div>
              </div>
            </div>
          </div>


          <div className="Button-container">
            {renderCTAs()}
          </div>

        </div>
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess} />}
      </div>
  );
}

export default App;
