/*
  Inventory
  <Inventory />
 */

import React from 'react';
import AddFishForm from './AddFishForm';
import autobind from 'autobind-decorator';
import firebase from 'firebase';

var config = {
  apiKey: "AIzaSyAugx40rRsY7-PDXdOfpsHRi--FbJ3AQjk",
  authDomain: "catch-of-the-day-b1acc.firebaseapp.com",
  databaseURL: "https://catch-of-the-day-b1acc.firebaseio.com",
  storageBucket: "catch-of-the-day-b1acc.appspot.com",
};

firebase.initializeApp(config);
const ref = firebase.database().ref();

@autobind
class Inventory extends React.Component {

  constructor() {
    super();

    this.state = {
      uid : ''
    }
  }

  authenticate(authProvider) {
    switch (authProvider) {
      case 'github':
        var provider = new firebase.auth.GithubAuthProvider();
        break;
      case 'facebook':
        var provider = new firebase.auth.FacebookAuthProvider();
        break;
      case 'twitter':
        var provider = new firebase.auth.TwitterAuthProvider();
        break;
    }

    firebase.auth().signInWithPopup(provider)
    .then(this.authHandler)
    .catch(function(error) {
      console.error(error);
    });
  }

  componentWillMount() {
    firebase.auth().onAuthStateChanged(function(user) {
      if(user) {
        this.authHandler(user);
      }else{
        this.logout();
      }
    }.bind(this));
  }

  logout() {
    firebase.auth().signOut();
    this.setState({
      uid : null
    });
  }

  authHandler(authData) {
    const storeRef = ref.child(this.props.params.storeId);
    const uid = authData.uid || authData.user.uid;

    storeRef.on('value', (snapshot)=> {
      var data = snapshot.val() || {};

      // claim it as our own if there is no owner already
      if(!data.owner) {
        storeRef.set({
          owner : uid
        });
      }

      // update our state to reflect the current store owner and user
      this.setState({
        uid : uid,
        owner : data.owner || uid
      });
    });
  }

  renderLogin() {
    return (
      <nav className="login">
        <h2>Inventory</h2>
        <p>Sign in to manage your store's inventory</p>
        <button className="github" onClick={this.authenticate.bind(this, 'github')}>Log In with GitHub</button>
        <button className="facebook" onClick={this.authenticate.bind(this, 'facebook')}>Log In with Facebook</button>
        <button className="twitter" onClick={this.authenticate.bind(this, 'twitter')}>Log In with Twitter</button>
      </nav>
    )
  }

  renderInventory(key) {
    var linkState = this.props.linkState;
    return (
      <div className= "fish-edit" key={key}>
        <input type="text" valueLink={linkState('fishes.' + key + '.name')} />
        <input type="text" valueLink={linkState('fishes.' + key + '.price')} />
        <select valueLink={linkState('fishes.' + key + '.status')}>
          <option value="unavailable">Sold Out!</option>
          <option value="available">Fresh!</option>
        </select>

        <textarea valueLink={linkState('fishes.' + key + '.desc')} />
        <input type="text" valueLink={linkState('fishes.' + key + '.image')} />
        <button onClick={this.props.removeFish.bind(null, key)}>Remove Fish</button>
      </div>
    )
  }

  render() {
    let logoutButton = <button onClick={this.logout}>Log Out!</button>
    
    // fist check if they aren't logged in
    if(!this.state.uid) {
      return (
        <div>{this.renderLogin()}</div>
      )
    }

    if(this.state.uid !== this.state.owner) {
      return (
        <div>
          <p>Sorry, you aren't the owner of this store</p>
          {logoutButton}
        </div>
      )
    }

    return (
      <div>
        <h2>Inventory</h2>
        {logoutButton}
        {Object.keys(this.props.fishes).map(this.renderInventory)}
        <AddFishForm {...this.props} />
        <button onClick={this.props.loadSamples}>Load Sample Fishes</button>
      </div>
    )
  }
};

Inventory.propTypes = {
  addFish : React.PropTypes.func.isRequired,
  loadSamples : React.PropTypes.func.isRequired,
  fishes : React.PropTypes.object.isRequired,
  linkState : React.PropTypes.func.isRequired,
  removeFish : React.PropTypes.func.isRequired,
}


export default Inventory;
