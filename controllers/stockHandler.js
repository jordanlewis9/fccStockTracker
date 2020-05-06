const axios = require("axios");
const Stock = require("./../model/stockModel");

const findStock = (stockName) => Stock.findOne({ name: stockName });
const createStock = (stockName) => Stock.create({ name: stockName });

exports.getStock = async (req, res) => {
  try {
    const queryObj = Object.values(req.query);
    if (queryObj[0].length === 2) {
      const stockOne = queryObj[0][0];
      const stockTwo = queryObj[0][1];
      const firstData = await axios.get(
        `https://repeated-alpaca.glitch.me/v1/stock/${stockOne}/quote`
      );
      const secondData = await axios.get(
        `https://repeated-alpaca.glitch.me/v1/stock/${stockTwo}/quote`
      );
      let stockOneDB = await findStock(stockOne);
      let stockTwoDB = await findStock(stockTwo);
      if (!stockOneDB) {
        stockOneDB = await createStock(stockOne);
      }
      if (!stockTwoDB) {
        stockTwoDB = await createStock(stockTwo);
      }
      console.log("two stocks");
      return res.status(200).json({
        stockData: [
          {
            stock: stockOneDB.name,
            price: firstData.data.latestPrice.toString(),
            rel_likes: stockOneDB.likes - stockTwoDB.likes,
          },
          {
            stock: stockTwoDB.name,
            price: secondData.data.latestPrice.toString(),
            rel_likes: stockTwoDB.likes - stockOneDB.likes,
          },
        ],
      });
    } else if (queryObj.length === 1) {
      const data = await axios.get(
        `https://repeated-alpaca.glitch.me/v1/stock/${req.query.stock}/quote`
      );
      let reqStock = await findStock(req.query.stock);
      if (!reqStock) {
        reqStock = await createStock(req.query.stock);
      }
      return res.status(200).json({
        stockData: {
          stock: reqStock.name,
          price: data.data.latestPrice.toString(),
          likes: reqStock.likes,
        },
      });
    } else {
      return res.status(400).json({
        status: "error",
        message: "You must choose either one or two stocks",
      });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.addLike = async (req, res) => {
  try {
    if (req.query.like !== "true") {
      return res.status(400).json({
        status: "fail",
        message: "You must send a like=true query to this route!",
      });
    }
    console.log(Object.entries(req.query));
    // 2 stocks, stock query in beginning of req.query
    if (
      Object.entries(req.query)[0][0] === "stock" ||
      Object.entries(req.query)[1][0] === "stock"
    ) {
      if (
        Object.entries(req.query)[0][1].length === 2 ||
        Object.entries(req.query)[1][1].length === 2
      ) {
        const stocks =
          Object.entries(req.query)[0][0] === "stock"
            ? [...Object.entries(req.query)[0][1]]
            : [...Object.entries(req.query)[1][1]];
        let likedStock1 = await findStock(stocks[0]);
        let likedStock2 = await findStock(stocks[1]);
        // both stocks not in DB
        if (!likedStock1 && !likedStock2) {
          const likedStock1Price = await axios.get(
            `https://repeated-alpaca.glitch.me/v1/stock/${stocks[0]}/quote`
          );
          const likedStock2Price = await axios.get(
            `https://repeated-alpaca.glitch.me/v1/stock/${stocks[1]}/quote`
          );
          if (
            !likedStock1Price.data.latestPrice ||
            !likedStock2Price.data.latestPrice
          ) {
            return res.status(400).json({
              status: "fail",
              message: "You must pass a valid stock ticker symbol.",
            });
          }
          likedStock1 = await Stock.create({
            name: stocks[0],
            likeAddresses: req.ip,
            likes: 1,
          });
          likedStock2 = await Stock.create({
            name: stocks[1],
            likeAddresses: req.ip,
            likes: 1,
          });
          return res.status(200).json({
            stockData: [
              {
                stock: likedStock1.name,
                price: likedStock1Price.data.latestPrice.toString(),
                rel_likes: likedStock1.likes - likedStock2.likes,
              },
              {
                stock: likedStock2.name,
                price: likedStock2Price.data.latestPrice.toString(),
                rel_likes: likedStock2.likes - likedStock1.likes,
              },
            ],
          });
        }
        // no first stock in DB
        if (!likedStock1) {
          // second stock has a like from current IP
          if (likedStock2.likeAddresses.indexOf(req.ip) !== -1) {
            const likedStock1Price = await axios.get(
              `https://repeated-alpaca.glitch.me/v1/stock/${stocks[0]}/quote`
            );
            const likedStock2Price = await axios.get(
              `https://repeated-alpaca.glitch.me/v1/stock/${stocks[1]}/quote`
            );
            if (!likedStock1Price.data.latestPrice) {
              return res.status(400).json({
                status: "fail",
                message: "You must pass a valid stock ticker symbol.",
              });
            }
            likedStock1 = await Stock.create({
              name: stocks[0],
              likeAddresses: req.ip,
              likes: 1,
            });
            return res.status(200).json({
              stockData: [
                {
                  stock: likedStock1.name,
                  price: likedStock1Price.data.latestPrice.toString(),
                  rel_likes: likedStock1.likes - likedStock2.likes,
                },
                {
                  stock: likedStock2.name,
                  price: likedStock2Price.data.latestPrice.toString(),
                  rel_likes: likedStock2.likes - likedStock1.likes,
                },
              ],
            });
          }
          // second stock does not have a like from current IP
          const likedStock1Price = await axios.get(
            `https://repeated-alpaca.glitch.me/v1/stock/${stocks[0]}/quote`
          );
          const likedStock2Price = await axios.get(
            `https://repeated-alpaca.glitch.me/v1/stock/${stocks[1]}/quote`
          );
          if (!likedStock1Price.data.latestPrice) {
            return res.status(400).json({
              status: "fail",
              message: "You must pass a valid stock ticker symbol.",
            });
          }
          likedStock1 = await Stock.create({
            name: stocks[0],
            likeAddresses: req.ip,
            likes: 1,
          });
          const newLike2 = [...likedStock2.likeAddresses, req.ip];
          const updatedLike2 = await Stock.findOneAndUpdate(
            { name: likedStock2.name },
            { likeAddresses: newLike2, likes: newLike2.length },
            { new: true }
          );
          return res.status(200).json({
            stockData: [
              {
                stock: likedStock1.name,
                price: likedStock1Price.data.latestPrice.toString(),
                rel_likes: likedStock1.likes - updatedLike2.likes,
              },
              {
                stock: updatedLike2.name,
                price: likedStock2Price.data.latestPrice.toString(),
                rel_likes: updatedLike2.likes - likedStock1.likes,
              },
            ],
          });
        }
        // no second stock in DB
        if (!likedStock2) {
          // first stock has like from current IP
          if (likedStock1.likeAddresses.indexOf(req.ip) !== -1) {
            const likedStock1Price = await axios.get(
              `https://repeated-alpaca.glitch.me/v1/stock/${stocks[0]}/quote`
            );
            const likedStock2Price = await axios.get(
              `https://repeated-alpaca.glitch.me/v1/stock/${stocks[1]}/quote`
            );
            if (!likedStock2Price.data.latestPrice) {
              return res.status(400).json({
                status: "fail",
                message: "You must pass a valid stock ticker symbol.",
              });
            }
            likedStock2 = await Stock.create({
              name: stocks[0],
              likeAddresses: req.ip,
              likes: 1,
            });
            return res.status(200).json({
              stockData: [
                {
                  stock: likedStock1.name,
                  price: likedStock1Price.data.latestPrice.toString(),
                  rel_likes: likedStock1.likes - likedStock2.likes,
                },
                {
                  stock: likedStock2.name,
                  price: likedStock2Price.data.latestPrice.toString(),
                  rel_likes: likedStock2.likes - likedStock1.likes,
                },
              ],
            });
          }
          const likedStock1Price = await axios.get(
            `https://repeated-alpaca.glitch.me/v1/stock/${stocks[0]}/quote`
          );
          const likedStock2Price = await axios.get(
            `https://repeated-alpaca.glitch.me/v1/stock/${stocks[1]}/quote`
          );
          if (!likedStock2Price.data.latestPrice) {
            return res.status(400).json({
              status: "fail",
              message: "You must pass a valid stock ticker symbol.",
            });
          }
          likedStock2 = await Stock.create({
            name: stocks[1],
            likeAddresses: req.ip,
            likes: 1,
          });
          const newLike1 = [...likedStock1.likeAddresses, req.ip];
          const updatedLike1 = await Stock.findOneAndUpdate(
            { name: likedStock1.name },
            { likeAddresses: newLike1, likes: newLike1.length },
            { new: true }
          );
          return res.status(200).json({
            stockData: [
              {
                stock: updatedLike1.name,
                price: likedStock1Price.data.latestPrice.toString(),
                rel_likes: updatedLike1.likes - likedStock2.likes,
              },
              {
                stock: likedStock2.name,
                price: likedStock2Price.data.latestPrice.toString(),
                rel_likes: likedStock2.likes - likedStock1.likes,
              },
            ],
          });
        }
        // one of the stocks contain a like from the current IP
        if (
          likedStock1.likeAddresses.indexOf(req.ip) !== -1 ||
          likedStock2.likeAddresses.indexOf(req.ip) !== -1
        ) {
          const notLiked =
            likedStock1.likeAddresses.indexOf(req.ip) !== -1
              ? likedStock2
              : likedStock1;
          const alreadyLiked =
            likedStock1.likeAddresses.indexOf(req.ip) !== -1
              ? likedStock1
              : likedStock2;
          const notLikedPrice = await axios.get(
            `https://repeated-alpaca.glitch.me/v1/stock/${notLiked.name}/quote`
          );
          const alreadyLikedPrice = await axios.get(
            `https://repeated-alpaca.glitch.me/v1/stock/${alreadyLiked.name}/quote`
          );
          const newLike = [notLiked.likeAddresses, req.ip];
          const updatedLike = await Stock.findOneAndUpdate(
            { name: notLiked.name },
            { likedAddresses: newLike, likes: newLike.length },
            { new: true }
          );
          return res.status(200).json({
            stockData: [
              {
                stock: alreadyLiked.name,
                price: alreadyLikedPrice.data.latestPrice.toString(),
                rel_likes: alreadyLiked.likes - updatedLike.likes,
              },
              {
                stock: updatedLike.name,
                price: notLikedPrice.data.latestPrice.toString(),
                rel_likes: updatedLike.likes - alreadyLiked.likes,
              },
            ],
          });
          // both stocks contain a like from current IP
        } else if (
          likedStock1.likeAddresses.indexOf(req.ip) !== -1 &&
          likedStock2.likeAddresses.indexOf(req.ip) !== -1
        ) {
          res.status(400).json({
            status: "fail",
            message: "Both stocks already contain a like from this IP address",
          });
        }
        // both stocks exist in DB and do not contain a like from IP
        const firstStockPrice = await axios.get(
          `https://repeated-alpaca.glitch.me/v1/stock/${likedStock1.name}/quote`
        );
        const secondStockPrice = await axios.get(
          `https://repeated-alpaca.glitch.me/v1/stock/${likedStock2.name}/quote`
        );
        const newLike1 = [...likedStock1.likeAddresses, req.ip];
        const newLike2 = [...likedStock2.likeAddresses, req.ip];
        const updatedLike1 = await Stock.findOneAndUpdate(
          { name: likedStock1.name },
          { likeAddresses: newLike1, likes: newLike1.length },
          { new: true }
        );
        const updatedLike2 = await Stock.findOneAndUpdate(
          { name: likedStock2.name },
          { likeAddresses: newLike2, likes: newLike2.length },
          { new: true }
        );
        return res.status(200).json({
          stockData: [
            {
              stock: updatedLike1.name,
              price: firstStockPrice.data.latestPrice.toString(),
              rel_likes: updatedLike1.likes - updatedLike2.likes,
            },
            {
              stock: updatedLike2.name,
              price: secondStockPrice.data.latestPrice.toString(),
              rel_likes: updatedLike2.likes - updatedLike1.likes,
            },
          ],
        });
      }

      //         // 2 stocks and a like, like query in beginning
      // } else if (
      //   Object.entries(req.query)[1][0] === "stock" &&
      //   Object.entries(req.query)[1][1].length === 2
      // ) {
      //   let stocks = [...Object.entries(req.query)[1][1]];
      //   let likedStock1 = await findStock(stocks[0]);
      //   let likedStock2 = await findStock(stocks[1]);
      //   // both stocks not in DB
      //   if (!likedStock1 && !likedStock2) {
      //     const firstStockPrice = await axios.get(
      //       `https://repeated-alpaca.glitch.me/v1/stock/${stocks[0]}/quote`
      //     );
      //     const secondStockPrice = await axios.get(
      //       `https://repeated-alpaca.glitch.me/v1/stock/${stocks[1]}/quote`
      //     );
      //     if (
      //       !firstStockPrice.data.latestPrice ||
      //       !secondStockPrice.data.latestPrice
      //     ) {
      //       return res.status(400).json({
      //         status: "fail",
      //         message: "You must pass a valid stock ticker symbol.",
      //       });
      //     }
      //     likedStock1 = await Stock.create({
      //       name: stocks[0],
      //       likeAddresses: req.ip,
      //       likes: 1,
      //     });
      //     likedStock2 = await Stock.create({
      //       name: stocks[1],
      //       likeAddresses: req.ip,
      //       likes: 1,
      //     });
      //     return res.status(200).json({
      //       data: [likedStock1, likedStock2],
      //     });
      //   }
      //   // no first stock in DB
      //   if (!likedStock1) {
      //     if (likedStock2.likeAddresses.indexOf(req.ip) !== -1) {
      //       return res.status(400).json({
      //         status: "fail",
      //         message: `Only one like of ${likedStock2.name} per IP address is allowed!`,
      //       });
      //     }
      //     const likedStock1Price = await axios.get(
      //       `https://repeated-alpaca.glitch.me/v1/stock/${stocks[0]}/quote`
      //     );
      //     if (!likedStock1Price.data.latestPrice) {
      //       return res.status(400).json({
      //         status: "fail",
      //         message: "You must pass a valid stock ticker symbol.",
      //       });
      //     }
      //     likedStock1 = await Stock.create({
      //       name: stocks[0],
      //       likeAddresses: req.ip,
      //       likes: 1,
      //     });
      //     const newLike2 = [...likedStock2.likeAddresses, req.ip];
      //     const updatedLike2 = await Stock.findOneAndUpdate(
      //       { name: likedStock2.name },
      //       { likeAddresses: newLike2, likes: newLike2.length },
      //       { new: true }
      //     );
      //     return res.status(200).json({
      //       data: [likedStock1, updatedLike2],
      //     });
      //   }
      //   // no second stock in DB
      //   if (!likedStock2) {
      //     if (likedStock1.likeAddresses.indexOf(req.ip) !== -1) {
      //       return res.status(400).json({
      //         status: "fail",
      //         message: `Only one like of ${likedStock1.name} per IP address is allowed!`,
      //       });
      //     }
      //     const likedStock2Price = await axios.get(
      //       `https://repeated-alpaca.glitch.me/v1/stock/${stocks[1]}/quote`
      //     );
      //     if (!likedStock2Price.data.latestPrice) {
      //       return res.status(400).json({
      //         status: "fail",
      //         message: "You must pass a valid stock ticker symbol.",
      //       });
      //     }
      //     likedStock2 = await Stock.create({
      //       name: stocks[1],
      //       likeAddresses: req.ip,
      //       likes: 1,
      //     });
      //     const newLike1 = [...likedStock1.likeAddresses, req.ip];
      //     const updatedLike1 = await Stock.findOneAndUpdate(
      //       { name: likedStock1.name },
      //       { likeAddresses: newLike1, likes: newLike1.length },
      //       { new: true }
      //     );
      //     return res.status(200).json({
      //       data: [updatedLike1, likedStock2],
      //     });
      //   }
      //   if (
      //     likedStock1.likeAddresses.indexOf(req.ip) !== -1 ||
      //     likedStock2.likeAddresses.indexOf(req.ip) !== -1
      //   ) {
      //     return res.status(400).json({
      //       status: "fail",
      //       message: "Only one like per IP address is allowed!",
      //     });
      //   }
      //   const newLike1 = [...likedStock1.likeAddresses, req.ip];
      //   const newLike2 = [...likedStock2.likeAddresses, req.ip];
      //   const updatedLike1 = await Stock.findOneAndUpdate(
      //     { name: likedStock1.name },
      //     { likeAddresses: newLike1, likes: newLike1.length },
      //     { new: true }
      //   );
      //   const updatedLike2 = await Stock.findOneAndUpdate(
      //     { name: likedStock2.name },
      //     { likeAddresses: newLike2, likes: newLike2.length },
      //     { new: true }
      //   );
      //   return res.status(200).json({
      //     data: [updatedLike1, updatedLike2],
      //   });
      // }
      else {
        // 1 stock and 1 like
        let likedStock = await Stock.findOne({ name: req.query.stock });
        if (!likedStock) {
          const likedStockPrice = await axios.get(
            `https://repeated-alpaca.glitch.me/v1/stock/${req.query.stock}/quote`
          );
          if (!likedStockPrice.data.latestPrice) {
            return res.status(400).json({
              status: "fail",
              message: "You must pass a valid stock ticker symbol.",
            });
          }
          likedStock = await Stock.create({
            name: req.query.stock,
            likeAddresses: [req.ip],
            likes: 1,
          });
          console.log(likedStock);
          return res.status(200).json({
            stockData: {
              stock: likedStock.name,
              price: likedStockPrice.data.latestPrice.toString(),
              likes: likedStock.likes,
            },
          });
        }
        if (likedStock.likeAddresses.indexOf(req.ip) !== -1) {
          return res.status(400).json({
            status: "fail",
            message: "Only one like of this stock per IP address is allowed",
          });
        }
        const likedStockPrice = await axios.get(
          `https://repeated-alpaca.glitch.me/v1/stock/${req.query.stock}/quote`
        );
        const newLike = [...likedStock.likeAddresses, req.ip];
        const addedLike = await Stock.findOneAndUpdate(
          { name: req.query.stock },
          { likes: newLike.length, likeAddresses: newLike },
          { new: true }
        );
        console.log(addedLike);
        return res.status(200).json({
          stockData: {
            stock: addedLike.name,
            price: likedStockPrice.data.latestPrice.toString(),
            likes: addedLike.likes,
          },
        });
      }
    } else {
      return res.status(400).json({
        status: "fail",
        message: "Please correct query format",
      });
    }
  } catch (err) {
    console.log(err);
  }
};
