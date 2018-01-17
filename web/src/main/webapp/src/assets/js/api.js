import axios from 'axios'
import { deepAssign } from './deepAssign'
import { ENV } from '../../../config.app/api.env'

export function api (url = '', data = {}, option = {data: {isEncryption: 0}}) {
  if (url === '') {
    return false
  }

  let defaultOption = {
    method: 'POST',
    url: ENV.public_path + url,
    data: data
  }
  defaultOption = deepAssign(defaultOption, option)

  return axios(defaultOption).then((res) => {
    return Promise.resolve(res.data)
  })
}
