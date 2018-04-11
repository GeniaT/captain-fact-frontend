import React from "react"
import { connect } from "react-redux"
import { I18nextProvider } from 'react-i18next'
import Joyride from 'react-joyride'
import { Helmet } from 'react-helmet'

import i18n from '../../i18n/i18n'
import { FlashMessages } from "../Utils"
import { fetchCurrentUser } from '../../state/users/current_user/effects'
import { stepSeen, tourSkipped } from '../../state/onboarding_steps/effects'
import { isAuthenticated } from '../../state/users/current_user/selectors'
import { uncompletedOnboardingSteps } from '../../state/onboarding_steps/selectors'
import { default as Sidebar } from "./Sidebar"
import { MainModalContainer } from "../Modal/MainModalContainer"
import PublicAchievementUnlocker from '../Users/PublicAchievementUnlocker'

@connect(state => ({
  locale: state.UserPreferences.locale,
  onboardingSteps: uncompletedOnboardingSteps(state),
  isAuthenticated: isAuthenticated(state)
}), {
    fetchCurrentUser: fetchCurrentUser,
    stepSeen: stepSeen,
    tourSkipped: tourSkipped
  })
export default class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      joyrideSteps: []
    }
    this.joyrideCallback = this.joyrideCallback.bind(this)
  }

  componentDidMount() {
    this.props.fetchCurrentUser()
  }

  componentDidUpdate(prevProps, prevState) {
    // it appears we have to maintain a local Array (as seen in joyride demo code). Failure to do so results some steps not registering
    if (this.props.onboardingSteps != prevProps.onboardingSteps && this.props.onboardingSteps.size > prevProps.onboardingSteps.size) {
      this.setState(currentState => {
        const newSteps = this.props.onboardingSteps.toArray().map(step => step.toJS())
        newSteps.forEach(step => {
          if (currentState.joyrideSteps.findIndex(s => s.uniqueId === step.uniqueId) === -1) {
            currentState.joyrideSteps = currentState.joyrideSteps.concat([step])
          }
        })
      })
      // update and refresh joyride if we are logged in
      if (this.props.isAuthenticated) {
        this.joyride.reset(true)
        this.forceUpdate()
      }
    }

    // start joyride if we logged in
    if (this.props.isAuthenticated && !prevProps.isAuthenticated) {
      this.joyride.reset(true)
    }
  }

  render() {
    const { joyrideSteps } = this.state
    const { isAuthenticated } = this.props

    return (
      <I18nextProvider i18n={i18n}>
        <div lang={this.props.locale}>
          <Helmet>
            <title>CaptainFact</title>
          </Helmet>
          <MainModalContainer />
          <Joyride
            ref={c => (this.joyride = c)}
            type="single"
            steps={joyrideSteps}
            run={isAuthenticated}
            showSkipButton={true}
            callback={this.joyrideCallback}
          />
          <div className="columns is-mobile is-gapless">
            <Sidebar className="column is-narrow" />
            <div id="main-container" className="column">
              {this.props.children}
            </div>
          </div>
          <FlashMessages />
          <PublicAchievementUnlocker achievementId={4} meetConditionsFunc={this.checkExtensionInstall} />
        </div>
      </I18nextProvider>
    )
  }

  joyrideCallback(data) {
    // after each step, POST completed_steps
    if (data.type === 'step:after' && data.action === 'close') {
      this.props.stepSeen(data.step.uniqueId)
    } else if (data.type === 'finished' && data.isTourSkipped) {
      this.props.tourSkipped()
    }
  }

  /**
   * Extension content scripts load after CaptainFact. We could have created a message
   * interface to communicate between the two but as our need is very basic for now
   * (detecting if extension is installed) we wait 5 seconds and check.
   * @returns {Promise}
   */
  checkExtensionInstall() {
    return new Promise(fulfill => {
      setTimeout(() => fulfill(!!document.getElementById('captainfact-extension-installed')), 5000)
    })
  }
}
